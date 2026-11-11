import { t } from "elysia";
import { ModuleId } from "src/config/modules";

const name = "call";

export default {
	meta: {
		name: name,
		// Same module as prescriptions: anyone who can run a consultation can call.
		module: ModuleId.APPOINTMENTS,
	},
	// ── click-to-call: ring the logged-in user, then bridge to the patient ──
	patient: {
		body: t.Object({
			patient: t.String(),
			appointment: t.Optional(t.String()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Object({
						call_id: t.Optional(t.String()),
						agent_number: t.String(),
						customer_number: t.String(),
					}),
				},
				{ description: `${name} patient response` },
			),
		},
		detail: { operationId: "patient" },
	},
};
