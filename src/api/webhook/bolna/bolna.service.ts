import Clinic from "src/models/clicknic/Clinic";
import Patient from "src/models/clicknic/Patient";
import IvrCallRequest, {
	IVR_ACTIVE_STATUSES,
} from "src/models/clicknic/IvrCallRequest";

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
export const resolveClinicForAgent = async (agentId?: string) => {
	if (agentId) {
		const clinic = await Clinic.findOne({ ivr_agent_ids: agentId })
			.sort({ default: -1, createdAt: 1 })
			.lean();
		if (clinic) return clinic;
	}
	return Clinic.findOne({ default: true }).lean();
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
}: {
	contactNumber: string;
	agentId?: string;
	executionId?: string;
	status?: string;
}) => {
	const phone = normalizePhone(contactNumber);
	if (phone.local.length < 10) return null;

	const clinic = await resolveClinicForAgent(agentId);
	if (!clinic) {
		console.error("🚀 ~ IVR ~ no clinic found for agent:", agentId);
		return null;
	}

	const scope = { clinic: clinic._id, tenant: clinic.tenant };

	let isNewPatient = false;
	let patient = await Patient.findOne({
		...scope,
		phone: { $in: phone.variants },
		deleted: false,
	})
		.sort({ createdAt: 1 })
		.lean();

	if (!patient) {
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
	}

	const callRequest = executionId
		? await IvrCallRequest.findOneAndUpdate(
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
				{ upsert: true, new: true },
			).lean()
		: null;

	return { clinic, patient, isNewPatient, callRequest };
};

/** Applies a Bolna execution payload (status webhook) to the stored call. */
export const applyExecutionUpdate = async (payload: any) => {
	const executionId = payload?.id || payload?.execution_id;
	if (!executionId) return null;

	const status = `${payload?.status ?? ""}`.toLowerCase();
	const telephony = payload?.telephony_data ?? {};

	let existing = await IvrCallRequest.findOne({
		execution_id: executionId,
	}).lean();

	// Status webhook arrived before (or without) the caller lookup.
	if (!existing) {
		const from = telephony.from_number || payload?.user_number;
		if (telephony.call_type && telephony.call_type !== "inbound") return null;
		if (!from) return null;

		const registered = await registerIncomingCall({
			contactNumber: from,
			agentId: payload?.agent_id,
			executionId,
			status: status || undefined,
		});
		existing = registered?.callRequest ?? null;
		if (!existing) return null;
	}

	const update: Record<string, any> = {};
	const duration = Number(telephony.duration ?? payload?.conversation_duration);
	if (Number.isFinite(duration) && duration > 0) update.duration = duration;
	if (telephony.recording_url) update.recording_url = telephony.recording_url;
	if (payload?.summary) update.summary = payload.summary;
	if (payload?.transcript) update.transcript = payload.transcript;

	// Webhooks can arrive out of order; never revive a call that has ended.
	if (status && !(isActiveStatus(status) && !existing.is_active)) {
		update.status = status;
		update.is_active = isActiveStatus(status);
		if (!update.is_active && existing.is_active) update.ended_at = new Date();
	}

	return IvrCallRequest.findByIdAndUpdate(existing._id, update, {
		new: true,
	}).lean();
};
