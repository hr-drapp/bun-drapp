import { t } from "elysia";
import { ModuleId } from "src/config/modules";
import { MetaPaginationSchema } from "src/utils/common";

const name = "media";

const detailSchema = t.Object({
	_id: t.String(),
	name: t.String(),
	media_type: t.String(),
	resource: t.Union([t.Number(), t.String()]),
	url: t.String(),
	size: t.String(),
	tenant: t.Optional(t.String()),
	clinic: t.Optional(t.String()),
	deleted: t.Boolean(),
	createdAt: t.String(),
	updatedAt: t.String(),
});

export default {
	meta: {
		name: name,
		detail: detailSchema,
		module: ModuleId.MEDIA,
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
		type: "multipart/form-data",
		body: t.Object({
			name: t.String(),
			media_type: t.String(),
			resource: t.Union([t.Number(), t.String()]),
			url: t.File(),
			size: t.Optional(t.String()),
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
		type: "multipart/form-data",
		body: t.Object({
			name: t.Optional(t.String()),
			media_type: t.Optional(t.String()),
			resource: t.Optional(t.Union([t.Number(), t.String()])),
			url: t.Optional(t.File()),
			size: t.Optional(t.String()),
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
