import schema from "./knowlarity.schema";
import { createElysia } from "src/utils/createElysia";
import { WebhookTrace } from "src/utils/webhook-trace";
import { WebhookLogStatus } from "src/models/clicknic/WebhookLog";
import { isValidApiKey, lookupCaller } from "./knowlarity.service";

const UNAUTHORIZED = { status: false, message: "Unauthorized", data: null };

/**
 * Knowlarity IVR routing: POST /get-agent, `x-api-key` checked only when KNOWLARITY_API_KEY is set.
 * Responds with the agent number to dial and which hold sound to play.
 * Every call is logged to webhook_log.
 */
export default createElysia({ prefix: schema.meta.name }).guard(
	{
		detail: { tags: ["webhook"] },
	},
	(app) =>
		app.post(
			"/",
			async ({ body, headers, request, set, path }) => {
				const trace = await WebhookTrace.start({
					provider: "knowlarity",
					event: "get-agent",
					method: request.method,
					path,
					ip: (headers as any)["x-forwarded-for"] || (headers as any)["x-real-ip"],
					body,
				});

				if (!isValidApiKey(headers["x-api-key"])) {
					trace.step(
						headers["x-api-key"]
							? "x-api-key mismatch, rejected with 401"
							: "No x-api-key sent, rejected with 401",
					);
					trace.set({ http_status: 401 });
					set.status = 401;
					void trace.finish(WebhookLogStatus.UNAUTHORIZED, { response: UNAUTHORIZED });
					return UNAUTHORIZED;
				}
				trace.step(
					process.env.KNOWLARITY_API_KEY
						? "API key verified"
						: "KNOWLARITY_API_KEY not set, API key check skipped",
				);

				try {
					trace.step(
						`get-agent: caller_number="${body.caller_number ?? ""}", knowlarity_number="${body.knowlarity_number ?? "-"}", call_uuid="${body.call_uuid ?? "-"}", call_start_time="${body.call_start_time ?? "-"}"`,
					);

					const isRegistered = body.caller_number
						? await lookupCaller(body.caller_number, trace)
						: (trace.step("caller_number missing, treating as new patient"), false);

					const response = {
						status: true,
						message: isRegistered ? "Registered patient" : "New patient",
						data: {
							is_registered: isRegistered,
							agent_number: process.env.KNOWLARITY_AGENT_NUMBER ?? "",
							hold_sound: isRegistered ? "registered" : "new",
						},
					};
					if (!response.data.agent_number) {
						trace.step("KNOWLARITY_AGENT_NUMBER is not set, agent_number returned empty");
					}
					trace.step(`Responded: ${response.message}, hold_sound="${response.data.hold_sound}"`);

					trace.set({ http_status: 200 });
					void trace.finish(WebhookLogStatus.SUCCESS, { response });
					return response;
				} catch (error: any) {
					trace.step(`Error: ${error?.message}`);
					trace.set({ http_status: 500 });
					void trace.finish(WebhookLogStatus.FAILED, { error: error?.stack || error?.message });
					throw error;
				}
			},
			schema.getAgent,
		),
);
