import { R } from "src/utils/response-helpers";
import schema from "./call.schema";
import Patient from "src/models/clicknic/Patient";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { Summary } from "src/config/modules";
import { normalizeQuery } from "src/utils/access-grants";
import { WebhookTrace } from "src/utils/webhook-trace";
import { WebhookLogStatus } from "src/models/clicknic/WebhookLog";
import {
	makeClickToCall,
	missingClickToCallConfig,
	toE164India,
} from "src/utils/Knowlarity";

export default createElysia({ prefix: schema.meta.name }).guard(
	{
		detail: {
			tags: [schema.meta.name],
			summary: Summary([schema.meta.module]),
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app.post(
			"/patient",
			async ({ body, user, request, path }) => {
				const missing = missingClickToCallConfig();
				if (missing.length) {
					return customError(
						`Calling is not set up yet (missing ${missing.join(", ")})`,
					);
				}

				const patient = await Patient.findOne(
					normalizeQuery({ _id: body.patient }, user),
				).lean();
				if (!patient) return customError("Patient not found");

				const customerNumber = toE164India(patient.phone);
				if (!customerNumber) {
					return customError("Patient does not have a valid phone number");
				}

				// The doctor's Knowlarity agent number, falling back to their login phone.
				const agentNumber = toE164India(
					user.ivr_agent_number || user.phone || "",
				);
				if (!agentNumber) {
					return customError("Your account has no phone number to call from");
				}

				const trace = await WebhookTrace.start({
					provider: "knowlarity",
					event: "click-to-call",
					method: request.method,
					path,
					body: { ...body, agent_number: agentNumber, customer_number: customerNumber },
				});
				trace.set({
					clinic: user.clinic,
					tenant: user.tenant,
					patient: patient._id,
					contact_number: customerNumber,
				});
				trace.step(`${user.name} (${agentNumber}) calling ${patient.name} (${customerNumber})`);

				try {
					const result = await makeClickToCall({ agentNumber, customerNumber });
					trace.set({ http_status: result.httpStatus });
					trace.step(`Knowlarity: ${result.message}`);
					void trace.finish(
						result.ok ? WebhookLogStatus.SUCCESS : WebhookLogStatus.FAILED,
						{ response: result.raw },
					);

					if (!result.ok) return customError(`Call failed: ${result.message}`);

					return R("Calling your phone now — pick up to connect to the patient", {
						call_id: result.callId,
						agent_number: agentNumber,
						customer_number: customerNumber,
					});
				} catch (error: any) {
					trace.step(`Error: ${error?.message}`);
					void trace.finish(WebhookLogStatus.FAILED, {
						error: error?.stack || error?.message,
					});
					return customError("Could not reach the calling service, please try again");
				}
			},
			schema.patient,
		),
);
