import { WebhookTrace } from "src/utils/webhook-trace";
import { WebhookLogStatus } from "src/models/clicknic/WebhookLog";
import { applyStreamEvent, type KnowlarityStreamEvent } from "./knowlarity.service";

/**
 * Knowlarity Konnect live update stream, a stand-in for the call status
 * webhook while Knowlarity's webhook is down. Every event is applied to
 * ivr_call_request and logged to webhook_log like a webhook call.
 *
 * Off unless KNOWLARITY_STREAM_ENABLED=true and KNOWLARITY_SR_API_KEY is set.
 * Enable it on one server only: every connection receives every event.
 */

const STREAM_URL = (apiKey: string) =>
	`https://konnect.knowlarity.com:8100/update-stream/${encodeURIComponent(apiKey)}/konnect`;

const RETRY_MIN_MS = 1000;
const RETRY_MAX_MS = 30000;

const log = (message: string) => console.log(`📞 Knowlarity stream: ${message}`);

/** Server-Sent Events (`data: {...}`), but bare JSON lines are accepted too. */
const parseLine = (line: string): KnowlarityStreamEvent | null => {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith(":")) return null;
	const payload = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
	if (!payload.startsWith("{")) return null;
	try {
		return JSON.parse(payload);
	} catch {
		return null;
	}
};

const handleEvent = async (event: KnowlarityStreamEvent) => {
	const trace = await WebhookTrace.start({
		provider: "knowlarity",
		event: `stream-${event.type === "CDR" ? "cdr" : `${event.event_type ?? "unknown"}`.toLowerCase()}`,
		method: "STREAM",
		path: "/update-stream",
		body: event,
	});
	try {
		const result = await applyStreamEvent(event, trace);
		void trace.finish(result ? WebhookLogStatus.SUCCESS : WebhookLogStatus.IGNORED);
	} catch (error: any) {
		trace.step(`Error: ${error?.message}`);
		void trace.finish(WebhookLogStatus.FAILED, { error: error?.stack || error?.message });
	}
};

// Events of one call arrive within milliseconds of each other (BRIDGE + ANSWER,
// both HANGUP legs), so they are applied one at a time to avoid racing updates.
let queue = Promise.resolve();
const enqueue = (event: KnowlarityStreamEvent) => {
	queue = queue.then(() => handleEvent(event));
};

/** One connection; resolves when the server closes the stream. */
const connectOnce = async (apiKey: string, onOpen: () => void) => {
	const res = await fetch(STREAM_URL(apiKey), {
		headers: { Accept: "text/event-stream" },
	});
	if (!res.ok || !res.body) {
		const text = await res.text().catch(() => "");
		throw new Error(`HTTP ${res.status} ${res.statusText} ${text.slice(0, 200)}`.trim());
	}
	log("connected, waiting for calls");
	onOpen();

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	for (;;) {
		const { value, done } = await reader.read();
		if (done) return;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split(/\r?\n/);
		buffer = lines.pop() ?? "";
		for (const line of lines) {
			const event = parseLine(line);
			if (event) enqueue(event);
		}
	}
};

/** Keeps the stream open for the life of the process, reconnecting with backoff. */
export const startKnowlarityStream = async () => {
	const apiKey = process.env.KNOWLARITY_SR_API_KEY;
	if (process.env.KNOWLARITY_STREAM_ENABLED !== "true") return;
	if (!apiKey) {
		log("KNOWLARITY_STREAM_ENABLED is set but KNOWLARITY_SR_API_KEY is missing, not started");
		return;
	}

	let retryMs = RETRY_MIN_MS;
	for (;;) {
		try {
			await connectOnce(apiKey, () => (retryMs = RETRY_MIN_MS));
			log("closed by server");
		} catch (error: any) {
			log(`connection error: ${error?.message}`);
			// A rejected key won't start working on retry.
			if (/^HTTP 40[13]/.test(error?.message ?? "")) {
				log("stopped, Knowlarity rejected KNOWLARITY_SR_API_KEY");
				return;
			}
		}
		log(`reconnecting in ${retryMs / 1000}s`);
		await new Promise((resolve) => setTimeout(resolve, retryMs));
		retryMs = Math.min(retryMs * 2, RETRY_MAX_MS);
	}
};
