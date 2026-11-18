import { t } from "elysia";

const name = "ground";

const clinicSchema = t.Object({
	_id: t.String(),
	id: t.Optional(t.Number()),
	name: t.Optional(t.String()),
	logo: t.Optional(t.String()),
});

const volunteerSchema = t.Object({
	_id: t.String(),
	name: t.String(),
	phone: t.String(),
	token: t.Optional(t.String()),
	clinic: t.Optional(clinicSchema),
});

const villageSchema = t.Object({
	_id: t.String(),
	id: t.Optional(t.Number()),
	name: t.String(),
});

const patientSchema = t.Object({
	_id: t.String(),
	id: t.Optional(t.Number()),
	name: t.String(),
	phone: t.String(),
	age: t.Optional(t.Number()),
	gender: t.Optional(t.Number()),
	village: t.Optional(t.Union([villageSchema, t.String(), t.Null()])),
	createdAt: t.String(),
});

const ok = (data: any, description: string) => ({
	200: t.Object(
		{ status: t.Boolean(), message: t.String(), data },
		{ description },
	),
});

export default {
	meta: { name },
	clinic: {
		query: t.Object({ c: t.Optional(t.String()) }),
		response: ok(clinicSchema, `${name} clinic response`),
		detail: { operationId: "clinic" },
	},
	register: {
		body: t.Object({
			name: t.String({ minLength: 2, maxLength: 60 }),
			phone: t.String({ minLength: 10, maxLength: 15 }),
			c: t.Optional(t.String()),
		}),
		response: ok(volunteerSchema, `${name} register response`),
		detail: { operationId: "register" },
	},
	me: {
		response: ok(volunteerSchema, `${name} me response`),
		detail: { operationId: "me" },
	},
	villages: {
		response: ok(t.Array(villageSchema), `${name} villages response`),
		detail: { operationId: "villages" },
	},
	createVillage: {
		body: t.Object({ name: t.String({ minLength: 2, maxLength: 60 }) }),
		response: ok(villageSchema, `${name} create village response`),
		detail: { operationId: "createVillage" },
	},
	createPatient: {
		body: t.Object({
			name: t.String({ minLength: 2, maxLength: 80 }),
			phone: t.String({ minLength: 10, maxLength: 15 }),
			age: t.Number({ minimum: 0, maximum: 120 }),
			gender: t.Number({ minimum: 1, maximum: 3 }),
			village: t.Optional(t.String()),
		}),
		response: ok(
			t.Object({ patient: patientSchema, duplicate: t.Boolean() }),
			`${name} create patient response`,
		),
		detail: { operationId: "createPatient" },
	},
	myPatients: {
		response: ok(
			t.Object({
				today: t.Number(),
				total: t.Number(),
				recent: t.Array(patientSchema),
			}),
			`${name} my patients response`,
		),
		detail: { operationId: "myPatients" },
	},
};
