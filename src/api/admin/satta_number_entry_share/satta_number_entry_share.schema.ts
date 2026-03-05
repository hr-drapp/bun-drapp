import { t } from "elysia";

const name = "Satta Entry Share";

export const SattaNumberEntrySchema = t.Object({
	_id: t.String(),
	category: t.Number(),
	game: t.String(),
	date: t.Date(),
	team_member: t.String(),
	team_member_share: t.Number(),
	team_member_share_type: t.Number(),
	master: t.String(),
	master_share: t.Number(),
	master_share_type: t.Number(),
	super_admin: t.String(),
	super_admin_share: t.Number(),
	super_admin_share_type: t.Number(),
});

const MetaPaginationSchema = t.Object({
	pages: t.Number(),
	total: t.Number(),
	page: t.Number(),
	size: t.Number(),
});

export default {
	list: {
		query: t.Object({
			category: t.String(),
			game: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(SattaNumberEntrySchema),
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
			type: t.String(),
			share: t.Number(),
			category: t.String(),
			game: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: SattaNumberEntrySchema,
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
		body: t.Optional(
			t.Object({
				name: t.String(),
				order: t.Numeric(),
			}),
		),
		query: t.Object({
			id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: SattaNumberEntrySchema,
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
	delete: {
		query: t.Object({
			id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: SattaNumberEntrySchema,
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
