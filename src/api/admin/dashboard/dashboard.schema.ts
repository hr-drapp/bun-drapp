import { t } from "elysia";
import { ModuleId } from "src/config/modules";

const name = "dashboard";

const doctorInsightSchema = t.Object({
	_id: t.String(),
	name: t.String(),
	profile_pic: t.String(),
	appointment_count: t.Number(),
});

const insightSchema = t.Object({
	total_appointments: t.Number(),
	doctors_available: t.Number(),
	active_sessions: t.Number(),
	walk_in_patients: t.Number(),
	doctors: t.Array(doctorInsightSchema),
});

export default {
	meta: {
		name: name,
		module: ModuleId.DASHBOARD,
	},
	insight: {
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: insightSchema,
				},
				{
					description: `${name} insight response`,
				},
			),
		},
		detail: {
			operationId: "insight",
		},
	},
};
