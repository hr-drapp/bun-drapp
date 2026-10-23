import schema from "./knowlarity.schema";
import { createElysia } from "src/utils/createElysia";
import { WebhookTrace } from "src/utils/webhook-trace";
import { WebhookLogStatus } from "src/models/clicknic/WebhookLog";
import { isValidApiKey, lookupCaller } from "./knowlarity.service";

const DEFAULT_AGENT_NUMBER = "+919983396152";

const UNAUTHORIZED = { status: false, message: "Unauthorized", data: null };

type CallParams = {
	caller_number?: string;
	knowlarity_number?: string;
	call_uuid?: string;
	call_start_time?: string;
};

/** Shared by POST (params in body) and GET (params in query). */
async function handleGetAgent({
	params,
	headers,
	request,
	set,
	path,
}: {
	params: CallParams;
	headers: Record<string, string | undefined>;
	request: Request;
	set: { status?: number | string };
	path: string;
}) {
	const trace = await WebhookTrace.start({
		provider: "knowlarity",
		event: "get-agent",
		method: request.method,
		path,
		ip: headers["x-forwarded-for"] || headers["x-real-ip"],
		body: params,
	});

	if (!isValidApiKey(headers["x-api-key"])) {
		trace.step(
			headers["x-api-key"]
				? "x-api-key mismatch, rejected with 401"
				: "No x-api-key sent, rejected with 401",
		);
		trace.set({ http_status: 401 });
		set.status = 401;
		void trace.finish(WebhookLogStatus.UNAUTHORIZED, {
			response: UNAUTHORIZED,
		});
		return UNAUTHORIZED;
	}
	trace.step(
		process.env.KNOWLARITY_API_KEY
			? "API key verified"
			: "KNOWLARITY_API_KEY not set, API key check skipped",
	);

	try {
		trace.step(
			`get-agent: caller_number="${
				params.caller_number ?? ""
			}", knowlarity_number="${params.knowlarity_number ?? "-"}", call_uuid="${
				params.call_uuid ?? "-"
			}", call_start_time="${params.call_start_time ?? "-"}"`,
		);

		const isRegistered = params.caller_number
			? await lookupCaller(params.caller_number, trace)
			: (trace.step("caller_number missing, treating as new patient"), false);

		const response = {
			status: true,
			message: isRegistered ? "Registered patient" : "New patient",
			data: {
				is_registered: isRegistered,
				agent_number:
					process.env.KNOWLARITY_AGENT_NUMBER || DEFAULT_AGENT_NUMBER,
				hold_sound: isRegistered ? "registered" : "new",
			},
		};
		if (!process.env.KNOWLARITY_AGENT_NUMBER) {
			trace.step(
				`KNOWLARITY_AGENT_NUMBER is not set, using default agent_number ${DEFAULT_AGENT_NUMBER}`,
			);
		}
		trace.step(
			`Responded: ${response.message}, hold_sound="${response.data.hold_sound}"`,
		);

		trace.set({ http_status: 200 });
		void trace.finish(WebhookLogStatus.SUCCESS, { response });
		return response;
	} catch (error: any) {
		trace.step(`Error: ${error?.message}`);
		trace.set({ http_status: 500 });
		void trace.finish(WebhookLogStatus.FAILED, {
			error: error?.stack || error?.message,
		});
		throw error;
	}
}

/**
 * Knowlarity IVR routing: POST or GET /get-agent, `x-api-key` checked only when KNOWLARITY_API_KEY is set.
 * POST reads params from the body, GET from the query string.
 * Responds with the agent number to dial and which hold sound to play.
 * Every call is logged to webhook_log.
 */
export default createElysia({ prefix: schema.meta.name }).guard(
	{
		detail: { tags: ["webhook"] },
	},
	(app) =>
		app
			.post(
				"/",
				({ body, headers, request, set, path }) =>
					handleGetAgent({ params: body, headers, request, set, path }),
				schema.getAgent,
			)
			.get(
				"/",
				({ query, headers, request, set, path }) =>
					handleGetAgent({ params: query, headers, request, set, path }),
				schema.getAgentQuery,
			),
);
