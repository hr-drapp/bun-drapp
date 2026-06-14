import { t } from "elysia";
import { ModuleId } from "src/config/modules";

const name = "prescription";

const drugSchema = t.Object({
	name: t.String(),
	dose: t.String(),
	frequency: t.String(),
	duration: t.String(),
	instructions: t.String(),
});

const investigationSchema = t.Object({
	name: t.String(),
	notes: t.Optional(t.String()),
});

const detailSchema = t.Object({
	_id: t.String(),
	clinic: t.String(),
	tenant: t.String(),
	patient: t.String(),
	doctor: t.String(),
	appointment: t.String(),
	drugs: t.Array(drugSchema),
	investigations: t.Array(investigationSchema),
	createdAt: t.String(),
	updatedAt: t.String(),
});

export default {
	meta: { name, detail: detailSchema, module: ModuleId.APPOINTMENTS },

	upsert: {
		body: t.Object({
			appointment: t.String(),
			patient: t.String(),
			doctor: t.String(),
			drugs: t.Array(drugSchema),
			investigations: t.Array(investigationSchema),
		}),
		response: {
			200: t.Object(
				{ status: t.Boolean(), message: t.String(), data: detailSchema },
				{ description: "prescription upsert response" },
			),
		},
		detail: { operationId: "upsert" },
	},

	byAppointment: {
		query: t.Object({ appointment: t.String() }),
		response: {
			200: t.Object(
				{ status: t.Boolean(), message: t.String(), data: t.Union([detailSchema, t.Null()]) },
				{ description: "prescription by appointment response" },
			),
		},
		detail: { operationId: "byAppointment" },
	},
};
