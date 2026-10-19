import Clinic from "src/models/clicknic/Clinic";
import Patient from "src/models/clicknic/Patient";
import IvrCallRequest, {
	IVR_ACTIVE_STATUSES,
} from "src/models/clicknic/IvrCallRequest";
import { WebhookTrace } from "src/utils/webhook-trace";

/** Placeholder name for patients auto-registered from an IVR call. */
export const IVR_UNKNOWN_PATIENT_NAME = "Unknown Caller";

/**
 * Bolna sends numbers like "+919876543210", and an unencoded "+" in the
 * query string arrives as a space. Patients are stored as 10-digit numbers.
 */
export const normalizePhone = (raw: string) => {
	const digits = `${raw ?? ""}`.replace(/\D/g, "");
	const local = digits.slice(-10);
	return {
		local,
		display: digits.length > 10 ? `+${digits}` : digits,
		variants: Array.from(
			new Set([local, `0${local}`, `91${local}`, `+91${local}`, digits]),
		),
	};
};

/**
 * Agent → clinic via Clinic.ivr_agent_ids, falling back to the default clinic.
 * If several clinics share an agent, the default (then oldest) clinic wins.
 */
export const resolveClinicForAgent = async (
	agentId?: string,
	trace?: WebhookTrace,
) => {
	if (agentId) {
		const clinic = await Clinic.findOne({ ivr_agent_ids: agentId })
			.sort({ default: -1, createdAt: 1 })
			.lean();
		if (clinic) {
			trace?.step(`Clinic resolved by agent mapping: "${clinic.name}" (${clinic._id})`);
			return clinic;
		}
		trace?.step(`No clinic has agent ${agentId} in ivr_agent_ids, trying default clinic`);
	} else {
		trace?.step("No agent_id sent, trying default clinic");
	}

	const clinic = await Clinic.findOne({ default: true }).lean();
	if (clinic) {
		trace?.step(`Clinic resolved by default fallback: "${clinic.name}" (${clinic._id})`);
	}
	return clinic;
};

export const isActiveStatus = (status?: string) =>
	IVR_ACTIVE_STATUSES.includes(`${status ?? ""}`.toLowerCase());

/**
 * Finds (or registers) the caller as a patient and records the call.
 * Idempotent per execution_id, so Bolna retries never duplicate entries.
 */
export const registerIncomingCall = async ({
	contactNumber,
	agentId,
	executionId,
	status = "in-progress",
	trace,
}: {
	contactNumber: string;
	agentId?: string;
	executionId?: string;
	status?: string;
	trace?: WebhookTrace;
}) => {
	const phone = normalizePhone(contactNumber);
	trace?.set({ contact_number: phone.display, execution_id: executionId });

	if (phone.local.length < 10) {
		trace?.step(`Invalid caller number "${contactNumber}" (fewer than 10 digits), stopping`);
		return null;
	}
	trace?.step(`Caller number "${contactNumber}" normalized to ${phone.local}`);

	const clinic = await resolveClinicForAgent(agentId, trace);
	if (!clinic) {
		trace?.step("No clinic found (no agent mapping and no default clinic), stopping");
		return null;
	}

	const scope = { clinic: clinic._id, tenant: clinic.tenant };
	trace?.set(scope);

	let isNewPatient = false;
	let patient = await Patient.findOne({
		...scope,
		phone: { $in: phone.variants },
		deleted: false,
	})
		.sort({ createdAt: 1 })
		.lean();

	if (patient) {
		trace?.step(`Existing patient found: "${patient.name}" (#${patient.id}, ${patient._id})`);
	} else {
		const created = await Patient.create({
			...scope,
			name: IVR_UNKNOWN_PATIENT_NAME,
			phone: phone.local,
			age: 0,
			gender: 3,
			profile_pic: "",
		});
		patient = created.toObject();
		isNewPatient = true;
		trace?.step(`No patient with this number, registered new patient #${patient.id} (${patient._id})`);
	}
	trace?.set({ patient: patient._id });

	if (!executionId) {
		trace?.step("No execution_id sent, IVR call request not recorded");
		return { clinic, patient, isNewPatient, callRequest: null };
	}

	// Typings ignore includeResultMetadata on lean(); the shape is { value, lastErrorObject }.
	const result = (await IvrCallRequest.findOneAndUpdate(
		{ execution_id: executionId },
		{
			$setOnInsert: {
				...scope,
				patient: patient._id,
				contact_number: phone.display,
				agent_id: agentId,
				execution_id: executionId,
				status,
				is_active: isActiveStatus(status),
				is_new_patient: isNewPatient,
			},
		},
		{ upsert: true, new: true, includeResultMetadata: true },
	).lean()) as unknown as {
		value: any;
		lastErrorObject?: { updatedExisting?: boolean };
	};

	const callRequest = result.value;
	trace?.set({ ivr_call_request: callRequest?._id });
	trace?.step(
		result.lastErrorObject?.updatedExisting
			? `IVR call request already existed for execution ${executionId} (retry), left unchanged`
			: `IVR call request created (${callRequest?._id}) with status "${status}"`,
	);

	return { clinic, patient, isNewPatient, callRequest };
};

/**
 * Applies a Bolna execution payload (status webhook) to the stored call.
 * Returns null when the payload was ignored.
 */
export const applyExecutionUpdate = async (
	payload: any,
	trace?: WebhookTrace,
) => {
	const executionId = payload?.id || payload?.execution_id;
	if (!executionId) {
		trace?.step("Payload has no execution id (id / execution_id), ignored");
		return null;
	}

	const status = `${payload?.status ?? ""}`.toLowerCase();
	const telephony = payload?.telephony_data ?? {};
	trace?.set({ execution_id: executionId });
	trace?.step(
		`Status update for execution ${executionId}: status="${status || "-"}", call_type="${telephony.call_type || "-"}"`,
	);

	let existing = await IvrCallRequest.findOne({
		execution_id: executionId,
	}).lean();

	// Status webhook arrived before (or without) the caller lookup.
	if (existing) {
		trace?.step(`Found IVR call request ${existing._id} (status "${existing.status}", active=${existing.is_active})`);
	} else {
		const from = telephony.from_number || payload?.user_number;
		if (telephony.call_type && telephony.call_type !== "inbound") {
			trace?.step(`No IVR call request and call is ${telephony.call_type}, ignored`);
			return null;
		}
		if (!from) {
			trace?.step("No IVR call request and payload has no caller number, ignored");
			return null;
		}

		trace?.step(`No IVR call request yet, registering caller ${from} from this payload`);
		const registered = await registerIncomingCall({
			contactNumber: from,
			agentId: payload?.agent_id,
			executionId,
			status: status || undefined,
			trace,
		});
		existing = registered?.callRequest ?? null;
		if (!existing) return null;
	}
	trace?.set({
		clinic: existing.clinic,
		tenant: existing.tenant,
		patient: existing.patient,
		ivr_call_request: existing._id,
		contact_number: existing.contact_number,
	});

	const update: Record<string, any> = {};
	const duration = Number(telephony.duration ?? payload?.conversation_duration);
	if (Number.isFinite(duration) && duration > 0) update.duration = duration;
	if (telephony.recording_url) update.recording_url = telephony.recording_url;
	if (payload?.summary) update.summary = payload.summary;
	if (payload?.transcript) update.transcript = payload.transcript;

	// Webhooks can arrive out of order; never revive a call that has ended.
	if (!status) {
		trace?.step("Payload has no status, status left unchanged");
	} else if (isActiveStatus(status) && !existing.is_active) {
		trace?.step(`Out-of-order status "${status}" ignored, call already ended as "${existing.status}"`);
	} else {
		update.status = status;
		update.is_active = isActiveStatus(status);
		if (!update.is_active && existing.is_active) update.ended_at = new Date();
		trace?.step(
			`Status "${existing.status}" → "${status}" (${update.is_active ? "call live" : "call ended"})`,
		);
	}

	const saved = Object.keys(update).filter((key) => !["status", "is_active"].includes(key));
	if (saved.length) trace?.step(`Saved: ${saved.join(", ")}`);

	return IvrCallRequest.findByIdAndUpdate(existing._id, update, {
		new: true,
	}).lean();
};
