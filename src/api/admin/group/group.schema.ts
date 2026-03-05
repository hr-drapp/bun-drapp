import { t } from "elysia";

export const GroupSchema = t.Object({
	_id: t.Optional(t.String()),
	name: t.Optional(t.String()),
	game_time: t.Optional(t.Array(t.String())),
	adminId: t.Optional(t.Array(t.String())),
	type: t.Optional(t.Number()),
	beat_type: t.Optional(t.Number()),
	game_time_count: t.Number(),
	admin_count: t.Number(),
});

const MetaPaginationSchema = t.Object({
	pages: t.Number(),
	total: t.Number(),
	page: t.Number(),
	size: t.Number(),
});

export default {
	create: {
		body: t.Object({
			name: t.String(),
			type: t.Number(),
			beat_type: t.Optional(t.Number()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: GroupSchema,
				},
				{
					description: "group created ",
				},
			),
		},
		detail: {
			operationId: "group created",
		},
	},
	list: {
		query: t.Object({
			page: t.String(),
			size: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(GroupSchema),
					meta: MetaPaginationSchema,
				},
				{
					description: "group list response",
				},
			),
		},
		detail: {
			operationId: "list response",
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
					data: GroupSchema,
				},
				{
					description: "group detail response",
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
					data: GroupSchema,
				},
				{
					description: "delete response",
				},
			),
		},
		detail: {
			operationId: "delete response",
		},
	},
	update: {
		query: t.Object({
			id: t.String(),
		}),
		body: t.Object({
			name: t.Optional(t.String()),
			type: t.Optional(t.Number()),
			beat_type: t.Optional(t.Number()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: GroupSchema,
				},
				{
					description: "group Updated",
				},
			),
		},
		detail: {
			operationId: "groupUpddate",
		},
	},
};
