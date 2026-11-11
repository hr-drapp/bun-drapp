import { normalizePhone } from "src/api/webhook/bolna/bolna.service";

/**
 * Knowlarity Click-to-Call (SuperReceptionist "Make Outbound Call").
 *
 * Knowlarity first rings `agent_number` (the doctor). When the doctor picks up,
 * it dials `customer_number` (the patient) and bridges the two. The patient sees
 * the clinic's Knowlarity number (or `caller_id`), never the doctor's phone.
 *
 * Env:
 *   KNOWLARITY_SR_API_KEY      SR API key → `authorization` header (already used by the stream)
 *   KNOWLARITY_APP_ACCESS_KEY  Application access key → `x-api-key` header
 *   KNOWLARITY_K_NUMBER        The clinic's SuperReceptionist number (e.g. +9180xxxxxxxx)
 *   KNOWLARITY_CALLER_ID       Optional outgoing CLI number shown to the patient
 *   KNOWLARITY_CHANNEL         Optional, defaults to "Basic"
 */
const BASE_URL = "https://kpi.knowlarity.com";

export const toE164India = (raw: string) => {
	const { local } = normalizePhone(raw);
	return local.length === 10 ? `+91${local}` : "";
};

export const missingClickToCallConfig = () =>
	[
		"KNOWLARITY_SR_API_KEY",
		"KNOWLARITY_APP_ACCESS_KEY",
		"KNOWLARITY_K_NUMBER",
	].filter((key) => !process.env[key]);

export type MakeCallResult = {
	ok: boolean;
	callId?: string;
	message: string;
	httpStatus: number;
	raw: any;
};

export const makeClickToCall = async ({
	agentNumber,
	customerNumber,
}: {
	agentNumber: string;
	customerNumber: string;
}): Promise<MakeCallResult> => {
	const channel = process.env.KNOWLARITY_CHANNEL || "Basic";
	const body: Record<string, string> = {
		k_number: process.env.KNOWLARITY_K_NUMBER!,
		agent_number: agentNumber,
		customer_number: customerNumber,
	};
	if (process.env.KNOWLARITY_CALLER_ID) {
		body.caller_id = process.env.KNOWLARITY_CALLER_ID;
	}

	const res = await fetch(`${BASE_URL}/${channel}/v1/account/call/makecall`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: process.env.KNOWLARITY_SR_API_KEY!,
			"x-api-key": process.env.KNOWLARITY_APP_ACCESS_KEY!,
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(15_000),
	});

	const text = await res.text();
	let raw: any = text;
	try {
		raw = JSON.parse(text);
	} catch {}

	// Success: { success: { status: "success", message, call_id } }
	// Error:   { error: { code, message } } or { message }
	const success = raw?.success;
	const ok = res.ok && !!success && !raw?.error;
	const message =
		success?.message ||
		raw?.error?.message ||
		raw?.message ||
		(typeof raw === "string" && raw) ||
		`Knowlarity responded with HTTP ${res.status}`;

	return {
		ok,
		callId: success?.call_id,
		message,
		httpStatus: res.status,
		raw,
	};
};
