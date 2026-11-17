import Admin from "src/models/clicknic/Admin";
import IvrCallRequest from "src/models/clicknic/IvrCallRequest";
import AutoIncementalId from "src/models/clicknic/AutoIncementalId";
import { RoleLevel } from "src/models/clicknic/Role";
import { WebhookTrace } from "src/utils/webhook-trace";
import { isActiveStatus, normalizePhone } from "../bolna/bolna.service";
import { lookupCaller } from "../knowlarity/knowlarity.service";
import { cleanEnv, dialXml, hangupXml, recordingProxyUrl, toE164India, webhookUrl } from "src/utils/Vobiz";

/** Vobiz posts form fields; every value arrives as a string. */
export type VobizParams = Record<string, string | undefined>;

const NO_AGENT_MESSAGE = "Sorry, no one is available to take your call right now. Please call again later.";

/** Missed-agent DialStatus values; anything else means the doctor was reached or the caller left. */
const AGENT_MISSED = new Set(["busy", "failed", "timeout", "no-answer"]);

// ── Round robin over the clinic's doctors ─────────────────────

/**
 * Doctors who take IVR calls: doctor logins (role level L2, same rule the IVR
 * dashboard uses) in the clinic. Agent number = ivr_agent_number, else phone,
 * so the call lands on the dashboard of the doctor whose phone rings.
 */
export const clinicAgents = async (clinic: any, tenant: any) => {
	const admins = await Admin.find({ clinic, tenant, deleted: false, super_admin: { $ne: true } })
		.populate({ path: "role", select: "level" })
		.select("_id name phone ivr_agent_number role")
		.sort({ _id: 1 })
		.lean();
	const numbers = admins
		.filter((a: any) => a.role?.level === RoleLevel.L2)
		.map((a: any) => normalizePhone(a.ivr_agent_number || a.phone || "").local)
		.filter((n) => n.length === 10);
	return Array.from(new Set(numbers));
};

/** Atomic counter per clinic, so concurrent calls never pick the same slot. */
const nextAgent = async (clinic: any, agents: string[]) => {
	const counter = await AutoIncementalId.findOneAndUpdate(
		{ id: `vobiz-round-robin-${clinic}` },
		{ $inc: { seq: 1 } },
		{ upsert: true, new: true },
	).lean();
	return agents[((counter?.seq ?? 1) - 1) % agents.length];
};

// ── Inbound call (Answer URL) ────────────────────────────────

/**
 * Registers the caller exactly like Knowlarity's /get-agent (patient lookup or
 * "Unknown Caller", ivr_call_request per CallUUID), then rings the next doctor.
 * Returns the XML for Vobiz.
 */
export const handleIncomingCall = async (params: VobizParams, trace: WebhookTrace) => {
	const callUuid = params.CallUUID;
	const from = params.From ?? "";
	const to = params.To ?? "";
	trace.step(`Incoming call: From="${from}", To="${to}", CallUUID="${callUuid ?? "-"}"`);

	const isRegistered = from
		? await lookupCaller({ callerNumber: from, knowlarityNumber: to, callUuid, trace })
		: (trace.step("From missing, treating as new patient"), false);
	trace.step(isRegistered ? "Registered patient" : "New patient");

	const call = callUuid ? await IvrCallRequest.findOne({ execution_id: callUuid }).lean() : null;

	let agent = "";
	if (call) {
		const agents = await clinicAgents(call.clinic, call.tenant);
		if (agents.length) {
			agent = await nextAgent(call.clinic, agents);
			trace.step(`Round robin over ${agents.length} doctor(s) [${agents.join(", ")}] → ${agent}`);
		} else {
			trace.step("Clinic has no doctor login with a valid phone");
		}
	} else {
		trace.step("No IVR call request (no CallUUID or clinic), cannot pick a clinic doctor");
	}

	if (!agent) {
		const fallback = normalizePhone(cleanEnv("VOBIZ_FALLBACK_AGENT_NUMBER")).local;
		if (fallback.length === 10) {
			agent = fallback;
			trace.step(`Using VOBIZ_FALLBACK_AGENT_NUMBER ${agent}`);
		}
	}

	if (!agent) {
		trace.step("No agent to dial, apologising and hanging up");
		if (call) await updateCall(call, { status: "no-answer" }, trace);
		return hangupXml(NO_AGENT_MESSAGE);
	}

	if (call) await updateCall(call, { status: "ringing", agent }, trace);

	// Caller ID on the doctor's phone is the clinic's Vobiz number (E.164).
	const callerId = toE164India(to) || `+${normalizePhone(to).display.replace(/^\+/, "")}`;
	return dialXml({
		number: `+91${agent}`,
		callerId,
		actionUrl: webhookUrl("/dial-result"),
		callbackUrl: webhookUrl("/dial-event"),
	});
};

// ── Live updates ─────────────────────────────────────────────

type CallUpdate = {
	status?: string;
	agent?: string;
	answered?: boolean;
	duration?: number;
	recordingUrl?: string;
};

/**
 * Same rules as Knowlarity's stream: the doctor who picks up owns the call,
 * an ended call is never revived, and out-of-order events are ignored.
 */
const updateCall = async (existing: any, change: CallUpdate, trace: WebhookTrace) => {
	trace.set({
		clinic: existing.clinic,
		tenant: existing.tenant,
		patient: existing.patient,
		ivr_call_request: existing._id,
		contact_number: existing.contact_number,
	});
	const update: Record<string, any> = {};

	if (change.recordingUrl) update.recording_url = change.recordingUrl;
	if (change.duration && change.duration > 0) update.duration = change.duration;

	const agent = change.agent ? normalizePhone(change.agent).local : "";
	if (agent.length === 10) {
		if (existing.agent_answered) {
			if (agent !== existing.agent_number) trace.step(`Agent ${agent} ignored, call already answered by ${existing.agent_number}`);
		} else if (change.answered && existing.is_active) {
			update.agent_number = agent;
			update.agent_answered = true;
			trace.step(`Answered by agent ${agent}`);
		} else if (agent !== existing.agent_number && existing.is_active) {
			update.agent_number = agent;
			trace.step(`Agent "${existing.agent_number ?? "-"}" → "${agent}"`);
		}
	}

	const status = change.status;
	if (status) {
		if (!existing.is_active) {
			trace.step(`Call already ended as "${existing.status}", status "${status}" ignored`);
		} else if (status !== existing.status) {
			update.status = status;
			update.is_active = isActiveStatus(status);
			if (!update.is_active) update.ended_at = new Date();
			trace.step(`Status "${existing.status}" → "${status}" (${update.is_active ? "call live" : "call ended"})`);
		}
	}

	const saved = Object.keys(update).filter((key) => !["status", "is_active", "ended_at"].includes(key));
	if (saved.length) trace.step(`Saved: ${saved.join(", ")}`);
	if (!Object.keys(update).length) return existing;
	return IvrCallRequest.findByIdAndUpdate(existing._id, update, { new: true }).lean();
};

const findCall = async (callUuid: string | undefined, trace: WebhookTrace) => {
	if (!callUuid) {
		trace.step("No call UUID in the event, ignored");
		return null;
	}
	trace.set({ execution_id: callUuid });
	const call = await IvrCallRequest.findOne({ execution_id: callUuid }).lean();
	trace.step(
		call
			? `Found IVR call request ${call._id} (status "${call.status}", active=${call.is_active})`
			: `No IVR call request for ${callUuid}, ignored`,
	);
	return call;
};

/** <Dial callbackUrl>: DialAction = answer | connected | hangup | digits (doctor leg). */
export const applyDialEvent = async (params: VobizParams, trace: WebhookTrace) => {
	const action = `${params.DialAction ?? ""}`.toLowerCase();
	trace.step(
		`Dial event "${action || params.Event || "-"}": B-leg to="${params.DialBLegTo ?? "-"}", status="${params.DialBLegStatus ?? "-"}", cause="${params.DialBLegHangupCause ?? "-"}"`,
	);
	const call = await findCall(params.DialALegUUID || params.CallUUID, trace);
	if (!call) return null;

	if (action === "answer" || action === "connected") {
		return updateCall(call, { status: "in-progress", agent: params.DialBLegTo, answered: true }, trace);
	}
	// The doctor leg ending doesn't end the call (the action URL decides what's next).
	trace.step(`Dial event "${action}" needs no status change`);
	return call;
};

/** <Dial action>: final dial result. Missed doctor → call ends as no-answer. */
export const applyDialResult = async (params: VobizParams, trace: WebhookTrace) => {
	const dialStatus = `${params.DialStatus ?? ""}`;
	trace.step(`Dial result: DialStatus="${dialStatus || "-"}", cause="${params.DialHangupCause ?? "-"}"`);
	const call = await findCall(params.DialALegUUID || params.CallUUID, trace);
	const missed = AGENT_MISSED.has(dialStatus);
	if (call && missed) await updateCall(call, { status: "no-answer" }, trace);
	return {
		call,
		xml: missed ? hangupXml(NO_AGENT_MESSAGE) : hangupXml(),
	};
};

/** Application Hangup URL: the caller's leg ended. */
export const applyHangup = async (params: VobizParams, trace: WebhookTrace) => {
	trace.step(`Hangup: Duration="${params.Duration ?? "-"}", cause="${params.HangupCause ?? "-"}"`);
	const call = await findCall(params.CallUUID, trace);
	if (!call) return null;
	const duration = Number(params.Duration ?? params.BillDuration);
	return updateCall(
		call,
		{
			status: call.agent_answered ? "completed" : "no-answer",
			duration: Number.isFinite(duration) ? duration : undefined,
		},
		trace,
	);
};

/** <Record callbackUrl>: RecordStop with the RecordingID once the file is ready. */
export const applyRecording = async (params: VobizParams, trace: WebhookTrace) => {
	const recordingId = params.RecordingID;
	trace.step(
		`Recording ready: RecordingID="${recordingId ?? "-"}", duration="${params.RecordingDuration ?? "-"}s", reason="${params.RecordingEndReason ?? "-"}"`,
	);
	if (!recordingId) {
		trace.step("No RecordingID, ignored");
		return null;
	}
	const call = await findCall(params.CallUUID, trace);
	if (!call) return null;
	return updateCall(call, { recordingUrl: recordingProxyUrl(recordingId) }, trace);
};
