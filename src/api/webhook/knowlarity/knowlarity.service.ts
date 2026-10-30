import { timingSafeEqual } from "crypto";
import Clinic from "src/models/clicknic/Clinic";
import Patient from "src/models/clicknic/Patient";
import IvrCallRequest from "src/models/clicknic/IvrCallRequest";
import { WebhookTrace } from "src/utils/webhook-trace";
import {
	IVR_UNKNOWN_PATIENT_NAME,
	isActiveStatus,
	normalizePhone,
} from "../bolna/bolna.service";

const KNOWLARITY_CLINIC_ID = "69de8c299b532254712e76c0";

/**
 * The API key is optional for now: while KNOWLARITY_API_KEY is unset every
 * request is allowed (testing phase). Set it to start enforcing `x-api-key`.
 */
export const isValidApiKey = (received?: string) => {
	const expected = process.env.KNOWLARITY_API_KEY;
	if (!expected) return true;
	if (!received) return false;
	const a = Buffer.from(received);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Registered = a patient with this number already exists in the clinic.
 * A first-time caller is registered as "Unknown Caller" and answered as new,
 * so the next call from the same number comes back as registered.
 * Like Bolna, the call is recorded in ivr_call_request, idempotent per call_uuid.
 */
export const lookupCaller = async ({
	callerNumber,
	knowlarityNumber,
	callUuid,
	trace,
}: {
	callerNumber: string;
	knowlarityNumber?: string;
	callUuid?: string;
	trace: WebhookTrace;
}) => {
	const phone = normalizePhone(callerNumber);
	trace.set({ contact_number: phone.display, execution_id: callUuid });

	if (phone.local.length < 10) {
		trace.step(`Invalid caller number "${callerNumber}" (fewer than 10 digits), treating as new patient`);
		return false;
	}
	trace.step(`Caller number "${callerNumber}" normalized to ${phone.local}`);

	// TEMP: pinned to clicknic Clinic until clinic is resolved from knowlarity_number
	const clinic = await Clinic.findById(KNOWLARITY_CLINIC_ID).lean();
	if (!clinic) {
		trace.step(`Clinic ${KNOWLARITY_CLINIC_ID} not found, treating as new patient`);
		return false;
	}
	trace.set({ clinic: clinic._id, tenant: clinic.tenant });

	const scope = { clinic: clinic._id, tenant: clinic.tenant };
	let isNewPatient = false;
	let patient = await Patient.findOne({
		...scope,
		phone: { $in: phone.variants },
		deleted: false,
	})
		.sort({ createdAt: 1 })
		.lean();

	if (patient) {
		trace.step(`Registered patient found: "${patient.name}" (#${patient.id}, ${patient._id})`);
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
		trace.step(`No patient with ${phone.local} in clinic "${clinic.name}", registered new patient #${created.id} (${created._id})`);
	}
	trace.set({ patient: patient._id });

	await recordCall({ scope, patientId: patient._id, phone: phone.display, knowlarityNumber, callUuid, isNewPatient, trace });

	return !isNewPatient;
};

/** Adds the call to ivr_call_request; Knowlarity retries with the same call_uuid are no-ops. */
const recordCall = async ({
	scope,
	patientId,
	phone,
	knowlarityNumber,
	callUuid,
	isNewPatient,
	trace,
}: {
	scope: { clinic: any; tenant: any };
	patientId: any;
	phone: string;
	knowlarityNumber?: string;
	callUuid?: string;
	isNewPatient: boolean;
	trace: WebhookTrace;
}) => {
	if (!callUuid) {
		trace.step("No call_uuid sent, IVR call request not recorded");
		return;
	}

	const status = "in-progress";
	// Typings ignore includeResultMetadata on lean(); the shape is { value, lastErrorObject }.
	const result = (await IvrCallRequest.findOneAndUpdate(
		{ execution_id: callUuid },
		{
			$setOnInsert: {
				...scope,
				patient: patientId,
				contact_number: phone,
				agent_id: knowlarityNumber,
				execution_id: callUuid,
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
	trace.set({ ivr_call_request: callRequest?._id });
	trace.step(
		result.lastErrorObject?.updatedExisting
			? `IVR call request already existed for call ${callUuid} (retry), left unchanged`
			: `IVR call request created (${callRequest?._id}) with status "${status}"`,
	);
};

/** Konnect update-stream event: telephony events carry `event_type`, the end-of-call record `type: "CDR"`. */
export type KnowlarityStreamEvent = {
	uuid?: string;
	event_type?: string;
	type?: string;
	call_direction?: string;
	Call_Type?: string;
	business_call_type?: string;
	customer_number?: string | null;
	agent_number?: string | null;
	caller_id?: string;
	destination?: string;
	knowlarity_number?: string;
	dispnumber?: string;
	call_recording?: string | null;
	resource_url?: string;
	call_duration?: number;
	[key: string]: unknown;
};

/**
 * Stream event → ivr_call_request status. ANSWER is the IVR picking up,
 * the agent is only on the line after BRIDGE.
 */
const STREAM_STATUS: Record<string, string> = {
	ORIGINATE: "ringing",
	ANSWER: "ringing",
	CUSTOMER_CALL: "ringing",
	CUSTOMER_ANSWER: "ringing",
	AGENT_CALL: "ringing",
	AGENT_ANSWER: "in-progress",
	BRIDGE: "in-progress",
};

const hangupStatus = (event: KnowlarityStreamEvent) =>
	/unanswered|missed/i.test(`${event.business_call_type ?? ""}`) ? "no-answer" : "completed";

/**
 * Applies one Konnect stream event to the stored call (stand-in for the call
 * status webhook). Unknown calls are registered through lookupCaller, so the
 * stream works even when /get-agent was never hit. Returns null when ignored.
 */
export const applyStreamEvent = async (event: KnowlarityStreamEvent, trace: WebhookTrace) => {
	const callUuid = event.uuid;
	const isCdr = event.type === "CDR";
	const kind = isCdr ? "CDR" : `${event.event_type ?? ""}`;
	if (!callUuid) {
		trace.step(`${kind || "Event"} has no uuid, ignored`);
		return null;
	}
	trace.set({ execution_id: callUuid });

	const inbound = isCdr ? event.Call_Type === "Incoming" : event.call_direction === "Inbound";
	const customer = isCdr ? event.caller_id : event.customer_number;
	trace.step(`${kind} for call ${callUuid}: direction="${event.call_direction ?? event.Call_Type ?? "-"}", customer="${customer ?? "-"}"`);

	let existing = await IvrCallRequest.findOne({ execution_id: callUuid }).lean();
	if (existing) {
		trace.step(`Found IVR call request ${existing._id} (status "${existing.status}", active=${existing.is_active})`);
	} else {
		if (!inbound) {
			trace.step("No IVR call request and call is not inbound, ignored");
			return null;
		}
		if (!customer) {
			trace.step("No IVR call request and event has no customer number, ignored");
			return null;
		}
		trace.step(`No IVR call request yet, registering caller ${customer} from this event`);
		await lookupCaller({
			callerNumber: customer,
			knowlarityNumber: event.knowlarity_number ?? event.dispnumber,
			callUuid,
			trace,
		});
		existing = await IvrCallRequest.findOne({ execution_id: callUuid }).lean();
		if (!existing) return null;
	}
	trace.set({
		clinic: existing.clinic,
		tenant: existing.tenant,
		patient: existing.patient,
		ivr_call_request: existing._id,
		contact_number: existing.contact_number,
	});

	const update: Record<string, any> = {};
	const recording = isCdr ? event.resource_url : event.call_recording;
	if (recording) update.recording_url = recording;
	const duration = Number(event.call_duration);
	if (isCdr && Number.isFinite(duration) && duration > 0) update.duration = duration;

	// Latest agent leg wins while the call is live (hunt: ring A, no answer, ring B).
	// The CDR's destination only fills a call that never reported its agent.
	const agentRaw = isCdr ? (existing.agent_number ? undefined : event.destination) : event.agent_number;
	const agent = agentRaw ? normalizePhone(agentRaw).local : "";
	if (agent.length === 10 && agent !== existing.agent_number && (existing.is_active || !existing.agent_number)) {
		update.agent_number = agent;
		trace.step(`Agent "${existing.agent_number ?? "-"}" → "${agent}"`);
	}

	// A CDR only ends a call that never got its HANGUP.
	const status =
		kind === "HANGUP" ? hangupStatus(event) : isCdr ? (existing.is_active ? "completed" : undefined) : STREAM_STATUS[kind];

	// Both call legs send HANGUP and events can cross; never revive an ended call.
	if (!status) {
		trace.step(isCdr ? "Call already ended, status left unchanged" : `Event "${kind}" has no status mapping, status left unchanged`);
	} else if (isActiveStatus(status) && !existing.is_active) {
		trace.step(`Out-of-order status "${status}" ignored, call already ended as "${existing.status}"`);
	} else if (!existing.is_active) {
		trace.step(`Call already ended as "${existing.status}", status left unchanged`);
	} else if (status !== existing.status) {
		update.status = status;
		update.is_active = isActiveStatus(status);
		if (!update.is_active) update.ended_at = new Date();
		trace.step(`Status "${existing.status}" → "${status}" (${update.is_active ? "call live" : "call ended"})`);
	}

	const saved = Object.keys(update).filter((key) => !["status", "is_active", "ended_at"].includes(key));
	if (saved.length) trace.step(`Saved: ${saved.join(", ")}`);
	if (!Object.keys(update).length) return existing;

	return IvrCallRequest.findByIdAndUpdate(existing._id, update, { new: true }).lean();
};
