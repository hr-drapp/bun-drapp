import { t } from "elysia";

const name = "Country";

export const CountrySchema = t.Object({
	_id: t.String(),
	name: t.String(),
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
			page: t.String(),
			size: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(CountrySchema),
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
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: CountrySchema,
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
					data: CountrySchema,
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
					data: CountrySchema,
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
