import { t } from "elysia";
import { ModuleId } from "src/config/modules";
import { MetaPaginationSchema } from "src/utils/common";

const name = "patient-health-record";

const valueSchema = t.Object({
	field: t.String(),
	value: t.Union([
		t.String(),
		t.Number(),
		t.Boolean(),
		t.Array(t.Union([t.String(), t.Number(), t.Boolean()])),
	]),
	remark: t.Optional(t.String()),
});

const detailSchema = t.Object({
	_id: t.String(),
	clinic: t.String(),
	tenant: t.String(),
	patient: t.String(),
	doctor: t.String(),
	appointment: t.String(),
	status: t.Number(),
	type: t.Number(),
	values: t.Array(valueSchema),
	attachments: t.Array(t.String()),
	createdAt: t.String(),
	updatedAt: t.String(),
});

export default {
	meta: {
		name: name,
		detail: detailSchema,
		module: ModuleId.PATIENT_HEALTH_RECORDS,
	},
	list: {
		query: t.Object({
			page: t.String(),
			size: t.String(),
			search: t.Optional(t.String()),
			patient: t.Optional(t.String()),
			doctor: t.Optional(t.String()),
			appointment: t.Optional(t.String()),
			status: t.Optional(t.String()),
			type: t.Optional(t.String()),
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
			patient: t.Optional(t.String()),
			doctor: t.Optional(t.String()),
			appointment: t.Optional(t.String()),
			status: t.Optional(t.Number()),
			type: t.Optional(t.Number()),
			values: t.Optional(t.Array(valueSchema)),
			attachments: t.Optional(t.Array(t.String())),
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
			status: t.Optional(t.Number()),
			type: t.Optional(t.Number()),
			values: t.Optional(t.Array(valueSchema)),
			attachments: t.Optional(t.Array(t.String())),
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
