import { t } from "elysia";
import { CountrySchema } from "../../country/country.schema";
import { CategorySchema } from "../../categories/categories.schema";

const name = "Product";

export const ProductSchema = t.Object({
	_id: t.Optional(t.String()),
	name: t.Optional(t.String()),
	description: t.Optional(t.String()),
	price: t.Optional(t.Number()),
	discount: t.Optional(t.Number()),
	images: t.Optional(t.Array(t.String())),
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
			search: t.Optional(t.String()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(ProductSchema),
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
	detail: {
		query: t.Object({
			id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: ProductSchema,
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
	create: {
		type: "multipart/form-data",
		body: t.Object({
			name: t.String(),
			description: t.String(),
			price: t.Numeric(),
			discount: t.Numeric(),
			images: t.Files(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: ProductSchema,
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
		body: t.Optional(
			t.Object({
				name: t.String(),
				description: t.String(),
				price: t.Numeric(),
				discount: t.Numeric(),
				images: t.Optional(t.Files()),
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
					data: ProductSchema,
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
					data: ProductSchema,
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
