import { t } from "elysia";
import { ModuleId } from "src/config/modules";
import { MetaPaginationSchema } from "src/utils/common";
import doctorSchema from "../doctor/doctor.schema";
import doctorTimeSlotSchema from "../doctor-time-slot/doctor-time-slot.schema";
import patientHealthRecordSchema from "../patient-health-record/patient-health-record.schema";

const name = "appointment";

const detailSchema = t.Object({
	_id: t.String(),
	token: t.Number(),
	patient: t.Object({ _id: t.String(), name: t.String() }),
	doctor: doctorSchema.meta.detail,
	time_slot: doctorTimeSlotSchema.meta.detail,
	date: t.String(),
	follow_up_date: t.Optional(t.String()),
	type: t.Number(),
	source: t.Number(),
	status: t.Number(),
	complaint: t.String(),
	notes: t.String(),
	createdAt: t.String(),
	updatedAt: t.String(),
	patient_health_records: t.Array(patientHealthRecordSchema.meta.detail),
	vitals: patientHealthRecordSchema.meta.detail,
});

export default {
	meta: {
		name: name,
		detail: detailSchema,
		module: ModuleId.APPOINTMENTS,
	},
	list: {
		query: t.Object({
			page: t.String(),
			size: t.String(),
			search: t.Optional(t.String()),
			statuses: t.Optional(t.String()),
			patients: t.Optional(t.String()),
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
			patient: t.String(),
			doctor: t.String(),
			time_slot: t.String(),
			date: t.String(),
			follow_up_date: t.Optional(t.String()),
			type: t.Number(),
			complaint: t.Optional(t.String()),
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
			patient: t.Optional(t.String()),
			doctor: t.Optional(t.String()),
			time_slot: t.Optional(t.String()),
			date: t.Optional(t.String()),
			follow_up_date: t.Optional(t.String()),
			type: t.Optional(t.Number()),
			status: t.Optional(t.Number()),
			complaint: t.Optional(t.String()),
			notes: t.Optional(t.String()),
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
