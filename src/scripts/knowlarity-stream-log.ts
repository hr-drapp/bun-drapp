/**
 * Read-only Knowlarity Konnect stream logger, for debugging call routing.
 * Prints every event (summary + raw JSON); never touches the database, so it
 * is safe to run next to the server's own stream.
 *
 *   bun run knowlarity:stream   (reads KNOWLARITY_SR_API_KEY from .env.local)
 */

const apiKey = process.env.KNOWLARITY_SR_API_KEY ?? process.argv[2];
if (!apiKey) {
	console.error("Set KNOWLARITY_SR_API_KEY (or pass the SR API key as the first argument).");
	process.exit(1);
}

const STREAM_URL = `https://konnect.knowlarity.com:8100/update-stream/${encodeURIComponent(apiKey)}/konnect`;

const time = () => new Date().toLocaleTimeString("en-IN", { hour12: false });
const log = (message: string) => console.log(`[${time()}] ${message}`);

const describe = (event: any) =>
	event.type === "CDR"
		? `CDR ${event.Call_Type ?? ""} ${event.business_call_type ?? ""} caller=${event.caller_id ?? "-"} destination=${event.destination ?? "-"} duration=${event.call_duration ?? "-"}s`
		: `${event.event_type} ${event.call_direction ?? ""} customer=${event.customer_number ?? "-"} agent=${event.agent_number ?? "-"}`;

/** Server-Sent Events (`data: {...}`), but bare JSON lines are accepted too. */
const parseLine = (line: string) => {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith(":")) return null;
	const payload = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
	if (!payload.startsWith("{")) return null;
	try {
		return JSON.parse(payload);
	} catch {
		log(`unparsed line: ${payload.slice(0, 200)}`);
		return null;
	}
};

for (let retryMs = 1000; ; retryMs = Math.min(retryMs * 2, 30000)) {
	try {
		const res = await fetch(STREAM_URL, { headers: { Accept: "text/event-stream" } });
		if (!res.ok || !res.body) {
			throw new Error(`HTTP ${res.status} ${res.statusText} ${(await res.text().catch(() => "")).slice(0, 200)}`.trim());
		}
		log("connected, waiting for calls");
		retryMs = 1000;

		const reader = res.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		for (;;) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split(/\r?\n/);
			buffer = lines.pop() ?? "";
			for (const line of lines) {
				const event = parseLine(line);
				if (!event) continue;
				log(`${describe(event)} uuid=${event.uuid}`);
				console.log(JSON.stringify(event, null, 2));
			}
		}
		log("closed by server");
	} catch (error: any) {
		log(`connection error: ${error?.message}`);
		// A rejected key won't start working on retry.
		if (/^HTTP 40[13]/.test(error?.message ?? "")) process.exit(1);
	}
	log(`reconnecting in ${retryMs / 1000}s`);
	await new Promise((resolve) => setTimeout(resolve, retryMs));
}
