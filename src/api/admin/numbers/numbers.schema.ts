import { t } from "elysia";
import { update } from "firebase/database";

export const NumbersSchema = t.Object({
	_id: t.String(),
	text: t.String(),
	texts: t.String(),
	status: t.Number(),
	type: t.Number(),
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
			text: t.String(),
			status: t.Optional(t.Numeric()),
			type: t.Optional(t.Numeric()),
			texts: t.Optional(t.String()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: NumbersSchema,
				},
				{
					description: "Response Number Creation",
				},
			),
		},
		detail: {
			operationId: "CreateNumber",
		},
	},
	list: {
		query: t.Object({
			page: t.String(),
			size: t.String(),
			game: t.Optional(t.String()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(NumbersSchema),
					meta: MetaPaginationSchema,
				},
				{
					definition: "Response Number List",
				},
			),
		},
		detail: {
			operationId: "ListNumbers",
		},
	},
	update: {
		query: t.Object({
			id: t.String(),
		}),
		body: t.Object({
			text: t.Optional(t.String()),
			texts: t.Optional(t.String()),
			status: t.Optional(t.Numeric()),
			type: t.Optional(t.Numeric()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: NumbersSchema,
				},
				{
					description: "Response Number Update",
				},
			),
		},
		detail: {
			operationId: "UpdateNumber",
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
					data: NumbersSchema,
				},
				{
					description: "Response Number Deletion",
				},
			),
		},
		detail: {
			operationId: "DeleteNumber",
		},
	},
};
