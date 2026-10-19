import { t } from "elysia";

const name = "bolna";

export default {
	meta: {
		name: name,
	},
	// ── caller lookup (Bolna "Use your internal APIs") ───────────────
	caller: {
		query: t.Object({
			contact_number: t.String(),
			agent_id: t.Optional(t.String()),
			execution_id: t.Optional(t.String()),
			token: t.Optional(t.String()),
		}),
		response: {
			200: t.Object(
				{
					is_registered: t.Boolean(),
					patient_id: t.String(),
					patient_name: t.String(),
					patient_phone: t.String(),
					patient_age: t.String(),
					patient_gender: t.String(),
					clinic_name: t.String(),
				},
				{
					description: `${name} caller lookup response, merged into the agent prompt`,
				},
			),
		},
		detail: { operationId: "caller" },
	},
	// ── call status webhook (execution payload) ──────────────────────
	execution: {
		query: t.Object({
			token: t.Optional(t.String()),
		}),
		body: t.Any(),
		response: {
			200: t.Object(
				{ status: t.Boolean(), message: t.String(), data: t.Any() },
				{ description: `${name} execution webhook response` },
			),
		},
		detail: { operationId: "execution" },
	},
};
