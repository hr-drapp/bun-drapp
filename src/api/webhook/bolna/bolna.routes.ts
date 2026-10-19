import { R } from "src/utils/response-helpers";
import schema from "./bolna.schema";
import { createElysia } from "src/utils/createElysia";
import { applyExecutionUpdate, registerIncomingCall } from "./bolna.service";
import { WebhookTrace } from "src/utils/webhook-trace";
import { WebhookLogStatus } from "src/models/clicknic/WebhookLog";

/** Shared secret configured in Bolna for both the caller lookup and status webhook. */
export const BOLNA_WEBHOOK_TOKEN = "86659ec7a4d8ef78cb3d1332ebdf08e394a8388e4786e0f0";

const genderLabel = (gender?: number) =>
	gender === 1 ? "Male" : gender === 2 ? "Female" : "";

const emptyCallerResponse = {
	is_registered: false,
	patient_id: "",
	patient_name: "",
	patient_phone: "",
	patient_age: "",
	patient_gender: "",
	clinic_name: "",
};

const UNAUTHORIZED = { status: false, message: "Unauthorized", data: null };

/**
 * Logs every Bolna call to webhook_log, checks the token, and runs the handler.
 * Bolna sends `Authorization: Bearer <token>` on the caller lookup. The status
 * webhook has no auth field in Bolna's UI, so `?token=` is accepted as well.
 * The final log write is not awaited so it never delays Bolna's 3s budget.
 */
const traced = async (
	event: string,
	ctx: any,
	handler: (trace: WebhookTrace) => Promise<{ response: any; ignored?: boolean }>,
) => {
	const { headers, query, body, request, set, path } = ctx;
	const { token, ...safeQuery } = query ?? {};

	const trace = await WebhookTrace.start({
		provider: "bolna",
		event,
		method: request.method,
		path,
		ip: headers?.["x-forwarded-for"] || headers?.["x-real-ip"],
		query: safeQuery,
		body,
	});

	const received =
		`${headers?.authorization ?? ""}`.replace(/^Bearer\s+/i, "") || token;
	if (received !== BOLNA_WEBHOOK_TOKEN) {
		trace.step(received ? "Token mismatch, rejected with 401" : "No token sent (header or ?token=), rejected with 401");
		trace.set({ http_status: 401 });
		set.status = 401;
		void trace.finish(WebhookLogStatus.UNAUTHORIZED, { response: UNAUTHORIZED });
		return UNAUTHORIZED;
	}
	trace.step("Token verified");

	try {
		const { response, ignored } = await handler(trace);
		trace.set({ http_status: 200 });
		void trace.finish(ignored ? WebhookLogStatus.IGNORED : WebhookLogStatus.SUCCESS, { response });
		return response;
	} catch (error: any) {
		trace.step(`Error: ${error?.message}`);
		trace.set({ http_status: 500 });
		void trace.finish(WebhookLogStatus.FAILED, { error: error?.stack || error?.message });
		throw error;
	}
};

export default createElysia({ prefix: schema.meta.name }).guard(
	{
		detail: { tags: ["webhook"] },
	},
	(app) =>
		app
			// Bolna requires a GET that responds within 3 seconds; every top-level
			// key becomes a {{variable}} in the agent prompt, so keep it flat.
			.get(
				"/caller",
				(ctx) =>
					traced("caller-lookup", ctx, async (trace) => {
						const { query } = ctx;
						trace.step(
							`Caller lookup: contact_number="${query.contact_number ?? ""}", agent_id="${query.agent_id ?? "-"}", execution_id="${query.execution_id ?? "-"}"`,
						);

						if (!query.contact_number) {
							trace.step("contact_number missing, returning empty caller data");
							return { response: emptyCallerResponse, ignored: true };
						}

						const result = await registerIncomingCall({
							contactNumber: query.contact_number,
							agentId: query.agent_id,
							executionId: query.execution_id,
							trace,
						});

						const patient = result?.patient;
						const isRegistered = !!patient && !result?.isNewPatient;

						const response = {
							is_registered: isRegistered,
							patient_id: patient ? `${patient.id ?? ""}` : "",
							patient_name: isRegistered ? patient?.name ?? "" : "",
							patient_phone: patient?.phone ?? "",
							patient_age:
								isRegistered && patient?.age ? `${patient.age}` : "",
							patient_gender: isRegistered ? genderLabel(patient?.gender) : "",
							clinic_name: result?.clinic?.name ?? "",
						};
						trace.step(
							`Responded to Bolna: is_registered=${response.is_registered}, patient_name="${response.patient_name}"`,
						);

						return { response, ignored: !result };
					}),
				schema.caller,
			)
			.post(
				"/execution",
				(ctx) =>
					traced("execution-status", ctx, async (trace) => {
						const entry = await applyExecutionUpdate(ctx.body, trace);
						return {
							response: R("execution processed", entry),
							ignored: !entry,
						};
					}),
				schema.execution,
			),
);
