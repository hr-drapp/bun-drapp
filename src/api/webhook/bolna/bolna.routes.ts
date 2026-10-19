import { R } from "src/utils/response-helpers";
import schema from "./bolna.schema";
import { createElysia } from "src/utils/createElysia";
import { applyExecutionUpdate, registerIncomingCall } from "./bolna.service";

/** Shared secret configured in Bolna for both the caller lookup and status webhook. */
export const BOLNA_WEBHOOK_TOKEN = "86659ec7a4d8ef78cb3d1332ebdf08e394a8388e4786e0f0";

const genderLabel =(gender?: number) =>
	gender === 1 ? "Male" : gender === 2 ? "Female" : "";

/**
 * Bolna sends `Authorization: Bearer <token>` on the caller lookup. The status
 * webhook has no auth field in Bolna's UI, so `?token=` is accepted as well.
 */
const isBolnaAuthorized = ({ headers, query, set }: any) => {
	const received =
		`${headers?.authorization ?? ""}`.replace(/^Bearer\s+/i, "") ||
		query?.token;

	if (received !== BOLNA_WEBHOOK_TOKEN) {
		set.status = 401;
		return { status: false, message: "Unauthorized", data: null };
	}
};

export default createElysia({ prefix: schema.meta.name }).guard(
	{
		detail: { tags: ["webhook"] },
		beforeHandle: isBolnaAuthorized,
	},
	(app) =>
		app
			// Bolna requires a GET that responds within 3 seconds; every top-level
			// key becomes a {{variable}} in the agent prompt, so keep it flat.
			.get(
				"/caller",
				async ({ query }) => {
					const result = await registerIncomingCall({
						contactNumber: query.contact_number,
						agentId: query.agent_id,
						executionId: query.execution_id,
					});

					const patient = result?.patient;
					const isRegistered = !!patient && !result?.isNewPatient;

					return {
						is_registered: isRegistered,
						patient_id: patient ? `${patient.id ?? ""}` : "",
						patient_name: isRegistered ? patient?.name ?? "" : "",
						patient_phone: patient?.phone ?? "",
						patient_age:
							isRegistered && patient?.age ? `${patient.age}` : "",
						patient_gender: isRegistered ? genderLabel(patient?.gender) : "",
						clinic_name: result?.clinic?.name ?? "",
					};
				},
				schema.caller,
			)
			.post(
				"/execution",
				async ({ body }) => {
					const entry = await applyExecutionUpdate(body);
					return R("execution processed", entry);
				},
				schema.execution,
			),
);
