import { t } from "elysia";
import { ModuleId } from "src/config/modules";
import { MetaPaginationSchema } from "src/utils/common";

const name = "doctor";

const detailSchema = t.Object({
	_id: t.String(),
	name: t.String(),
	total_count: t.Number(),
	createdAt: t.String(),
	updatedAt: t.String(),
});

export default {
	meta: {
		name: name,
		detail: detailSchema,
		module: ModuleId.GAME_CATEGORY,
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
			profile_pic: t.File(),
			// pictures: t.Optional(t.Files()),
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
			name: t.String(),
			profile_pic: t.String(),
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
					description: `${name} update response`,
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
