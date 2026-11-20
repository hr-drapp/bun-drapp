import { createHmac, timingSafeEqual } from "crypto";
import { normalizePhone } from "src/api/webhook/bolna/bolna.service";

/**
 * Vobiz telephony (Plivo-style XML + REST), the drop-in alternative to Knowlarity.
 *
 * Inbound: Vobiz posts every call to /webhook/vobiz/answer, we reply with XML
 * that records the call and <Dial>s the next doctor (round robin). Live status
 * arrives on the Dial callback, the action URL, the hangup URL and the
 * recording callback — no stream needed.
 *
 * Env:
 *   VOBIZ_AUTH_ID, VOBIZ_AUTH_TOKEN  REST API credentials (click-to-call, recording download)
 *   VOBIZ_NUMBER                     The clinic's Vobiz number (E.164), caller ID for click-to-call
 *   VOBIZ_PUBLIC_URL                 Optional; backend base URL Vobiz can reach (default below)
 *   VOBIZ_WEBHOOK_TOKEN              Optional; overrides the hardcoded webhook token below
 *   VOBIZ_FALLBACK_AGENT_NUMBER      Optional; dialled when the clinic has no doctor with a phone
 *   VOBIZ_RECORD_CALLS               "false" turns call recording off (default on)
 *   VOBIZ_DIAL_TIMEOUT               Seconds a doctor's phone rings (default 30)
 */
const API_BASE = "https://api.vobiz.ai/api/v1";

export const VOBIZ_PROVIDER = "vobiz";

/** Backend URL Vobiz calls back on (env VOBIZ_PUBLIC_URL overrides). */
const VOBIZ_DEFAULT_PUBLIC_URL = "https://test-api.clicknic.site";

/**
 * Shared secret Vobiz must send as ?token= on every webhook (env VOBIZ_WEBHOOK_TOKEN overrides).
 * Put it in the Answer/Hangup URLs configured in the Vobiz console.
 */
export const VOBIZ_WEBHOOK_TOKEN = "7f098cb14b0066be260a5aea442f08cee5703934f3cf0c3f";

/**
 * Env value without a trailing "# comment", whitespace or wrapping quotes.
 * Service env files (systemd/pm2) keep inline comments as part of the value.
 */
export const cleanEnv = (key: string) =>
	`${process.env[key] ?? ""}`
		.replace(/\s+#.*$/, "")
		.trim()
		.replace(/^(["'])(.*)\1$/, "$2");

const env = () => ({
	authId: cleanEnv("VOBIZ_AUTH_ID"),
	authToken: cleanEnv("VOBIZ_AUTH_TOKEN"),
	number: cleanEnv("VOBIZ_NUMBER"),
	publicUrl: (cleanEnv("VOBIZ_PUBLIC_URL") || VOBIZ_DEFAULT_PUBLIC_URL).replace(/\/+$/, ""),
	webhookToken: cleanEnv("VOBIZ_WEBHOOK_TOKEN") || VOBIZ_WEBHOOK_TOKEN,
});

const authHeaders = () => {
	const { authId, authToken } = env();
	return { "X-Auth-ID": authId, "X-Auth-Token": authToken };
};

/** 10-digit local → +91XXXXXXXXXX, "" when not a valid Indian number. */
export const toE164India = (raw: string) => {
	const { local } = normalizePhone(raw);
	return local.length === 10 ? `+91${local}` : "";
};

export const escapeXml = (s: string) =>
	`${s ?? ""}`
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

// ── Webhook auth ─────────────────────────────────────────────

/** Every Vobiz webhook must carry ?token= matching the webhook token. */
export const isValidWebhookToken = (received?: string) => {
	const expected = env().webhookToken;
	if (!expected) return true;
	if (!received) return false;
	const a = Buffer.from(received);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
};

/** Absolute URL of one of our Vobiz webhooks, carrying the webhook token. */
export const webhookUrl = (path: string, params: Record<string, string> = {}) => {
	const query = new URLSearchParams(params);
	const { webhookToken, publicUrl } = env();
	if (webhookToken) query.set("token", webhookToken);
	const qs = query.toString();
	return `${publicUrl}/webhook/vobiz${path}${qs ? `?${qs}` : ""}`;
};

// ── Signed values (recording links, click-to-call targets) ───

const sign = (value: string) =>
	createHmac("sha256", `vobiz:${env().authToken || env().webhookToken}`)
		.update(value)
		.digest("hex")
		.slice(0, 32);

export const verifySignature = (value: string, signature?: string) => {
	if (!signature) return false;
	const a = Buffer.from(signature);
	const b = Buffer.from(sign(value));
	return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Vobiz recording links need the API headers, so a browser <audio> can't play
 * them. We store a signed link to our own proxy instead (no login needed, the
 * signature is the key), which keeps the dashboard unchanged.
 */
export const recordingProxyUrl = (recordingId: string) =>
	`${env().publicUrl}/webhook/vobiz/recording/${encodeURIComponent(recordingId)}?sig=${sign(recordingId)}`;

export const signedTarget = (number: string) => ({ to: number, sig: sign(number) });

// ── XML ──────────────────────────────────────────────────────

const recordXml = () =>
	cleanEnv("VOBIZ_RECORD_CALLS") === "false"
		? ""
		: `\n  <Record recordSession="true" maxLength="3600" fileFormat="mp3" playBeep="false" redirect="false" callbackUrl="${escapeXml(webhookUrl("/recording"))}" callbackMethod="POST"/>`;

const dialTimeout = () => {
	const n = Number(cleanEnv("VOBIZ_DIAL_TIMEOUT"));
	return Number.isFinite(n) && n > 0 ? Math.round(n) : 30;
};

/** Records the whole call (when enabled) and rings one number. */
export const dialXml = ({
	number,
	callerId,
	actionUrl,
	callbackUrl,
	record = true,
	playUrl,
}: {
	number: string;
	callerId: string;
	actionUrl: string;
	callbackUrl: string;
	record?: boolean;
	/** Audio played to the caller before the doctor's phone rings. */
	playUrl?: string;
}) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>${record ? recordXml() : ""}${playUrl ? `\n  <Play>${escapeXml(playUrl)}</Play>` : ""}
  <Dial callerId="${escapeXml(callerId)}" timeout="${dialTimeout()}" action="${escapeXml(actionUrl)}" method="POST" redirect="true" callbackUrl="${escapeXml(callbackUrl)}" callbackMethod="POST">
    <Number>${escapeXml(number)}</Number>
  </Dial>
</Response>`;

export const hangupXml = (message?: string) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>${message ? `\n  <Speak>${escapeXml(message)}</Speak>` : ""}
  <Hangup/>
</Response>`;

/** Plays an audio file (public URL) and ends the call. */
export const playHangupXml = (audioUrl: string) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${escapeXml(audioUrl)}</Play>
  <Hangup/>
</Response>`;

/** Recorded IVR messages (MP3 on Cloudflare R2, public) that Vobiz <Play>s. */
export const IVR_AUDIO = {
	/** Played to registered patients before their call is routed to a doctor. */
	greetings: "https://pub-774909be42b649c5b90e8024f64ed26a.r2.dev/matrashakti-greetings.mp3",
	/** Played to callers who aren't registered patients; the call then ends. */
	unregistered: "https://pub-774909be42b649c5b90e8024f64ed26a.r2.dev/matrashakti-v1.mp3",
} as const;

// ── REST: click-to-call ──────────────────────────────────────

export const missingClickToCallConfig = () =>
	["VOBIZ_AUTH_ID", "VOBIZ_AUTH_TOKEN", "VOBIZ_NUMBER"].filter((key) => !cleanEnv(key));

export type MakeCallResult = {
	ok: boolean;
	callId?: string;
	message: string;
	httpStatus: number;
	raw: any;
};

/**
 * Same contract as Knowlarity's makeClickToCall: Vobiz first rings the doctor
 * (`agentNumber`); when they pick up, /click-answer dials the patient and
 * bridges them. The patient sees the clinic's Vobiz number.
 */
export const makeClickToCall = async ({
	agentNumber,
	customerNumber,
}: {
	agentNumber: string;
	customerNumber: string;
}): Promise<MakeCallResult> => {
	const { authId, number } = env();
	const res = await fetch(`${API_BASE}/Account/${encodeURIComponent(authId)}/Call/`, {
		method: "POST",
		headers: { "content-type": "application/json", ...authHeaders() },
		body: JSON.stringify({
			from: normalizePhone(number).display.replace(/^\+/, ""),
			to: agentNumber.replace(/^\+/, ""),
			answer_url: webhookUrl("/click-answer", signedTarget(customerNumber)),
			answer_method: "POST",
			time_limit: "3600",
		}),
		signal: AbortSignal.timeout(15_000),
	});

	const text = await res.text();
	let raw: any = text;
	try {
		raw = JSON.parse(text);
	} catch {}

	// Success: { api_id, message: "Call fired", request_uuid }
	const ok = res.ok && !!raw?.request_uuid;
	const message =
		raw?.message || raw?.error || (typeof raw === "string" && raw) || `Vobiz responded with HTTP ${res.status}`;

	return { ok, callId: raw?.request_uuid, message, httpStatus: res.status, raw };
};

// ── REST: recordings ─────────────────────────────────────────

/** Streams a recording from Vobiz (resolving its current media URL first). */
export const fetchRecording = async (recordingId: string) => {
	const { authId } = env();
	const meta = await fetch(
		`${API_BASE}/Account/${encodeURIComponent(authId)}/Recording/${encodeURIComponent(recordingId)}/`,
		{ headers: authHeaders(), signal: AbortSignal.timeout(15_000) },
	);
	if (!meta.ok) return null;
	const { recording_url } = (await meta.json().catch(() => ({}))) as { recording_url?: string };
	if (!recording_url) return null;
	const media = await fetch(recording_url, { headers: authHeaders(), redirect: "follow" });
	return media.ok ? media : null;
};
