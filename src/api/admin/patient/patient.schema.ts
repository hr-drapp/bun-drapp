import { t } from "elysia";
import { ModuleId } from "src/config/modules";
import { MetaPaginationSchema } from "src/utils/common";
import appointmentSchema from "../appointment/appointment.schema";
import patientHealthRecordSchema from "../patient-health-record/patient-health-record.schema";

const name = "patient";

const detailSchema = t.Object({
	_id: t.String(),
	id: t.Number(),
	name: t.String(),
	phone: t.String(),
	age: t.Number(),
	gender: t.Number(),
	profile_pic: t.String(),
	recent_appointment: appointmentSchema.meta.detail,
	vitals: patientHealthRecordSchema.meta.detail,
	createdAt: t.String(),
	updatedAt: t.String(),
});

export default {
	meta: {
		name: name,
		detail: detailSchema,
		module: ModuleId.PATIENTS,
	},
	list: {
		query: t.Object({
			page: t.String(),
			size: t.String(),
			search: t.Optional(t.String()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(detailSchema),
					meta: MetaPaginationSchema,
				},
				{
					description: `${name} list response`,
				},
			),
		},
		detail: {
			operationId: "list",
		},
	},
	create: {
		body: t.Object({
			name: t.String(),
			phone: t.String(),
			age: t.Number(),
			gender: t.Number(),
			profile_pic: t.Optional(t.String()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: detailSchema,
				},
				{
					description: `${name} create response`,
				},
			),
		},
		detail: {
			operationId: "create",
		},
	},
	update: {
		body: t.Object({
			name: t.Optional(t.String()),
			phone: t.Optional(t.String()),
			age: t.Optional(t.Number()),
			gender: t.Optional(t.Number()),
			profile_pic: t.Optional(t.String()),
		}),
		query: t.Object({
			id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: detailSchema,
				},
				{
					description: `${name} update response`,
				},
			),
		},
		detail: {
			operationId: "update",
		},
	},
	detail: {
		query: t.Object({
			id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: detailSchema,
				},
				{
					description: `${name} detail response`,
				},
			),
		},
		detail: {
			operationId: "detail",
		},
	},
	delete: {
		query: t.Object({
			id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: detailSchema,
				},
				{
					description: `${name} delete response`,
				},
			),
		},
		detail: {
			operationId: "delete",
		},
	},
};
