import { t } from "elysia";
import { ModuleId } from "src/config/modules";
import { MetaPaginationSchema } from "src/utils/common";

const name = "doctor-time-slot";

const detailSchema = t.Object({
	_id: t.String(),
	id: t.Number(),
	clinic: t.String(),
	tenant: t.String(),
	doctor: t.String(),
	start: t.Number(),
	end: t.Number(),
	status: t.Number(),
	deleted: t.Optional(t.Boolean()),
	createdAt: t.String(),
	updatedAt: t.String(),
});

export default {
	meta: {
		name: name,
		detail: detailSchema,
		module: ModuleId.DOCTOR_TIME_SLOTS,
	},
	list: {
		query: t.Object({
			page: t.String(),
			size: t.String(),
			search: t.Optional(t.String()),
			doctor: t.Optional(t.String()),
			clinic: t.Optional(t.String()),
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
			doctor: t.String(),
			start: t.Number(),
			end: t.Number(),
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
			clinic: t.Optional(t.String()),
			tenant: t.Optional(t.String()),
			doctor: t.Optional(t.String()),
			start: t.Optional(t.Number()),
			end: t.Optional(t.Number()),
			status: t.Optional(t.Number()),
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
