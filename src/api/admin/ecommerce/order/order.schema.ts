import { t } from "elysia";
import { CountrySchema } from "../../country/country.schema";
import { CategorySchema } from "../../categories/categories.schema";
import { UserSchema } from "../../users/users.schema";

const name = "Order";

export const OrderSchema = t.Object({
	_id: t.Optional(t.String()),
	user: t.Optional(UserSchema),
	items: t.Optional(t.Array(t.Any())),
	total_order_amount: t.Optional(t.Number()),
	delivery_charge: t.Optional(t.Number()),
	tax: t.Optional(t.Number()),
	total_amount: t.Optional(t.Number()),
	status: t.Optional(t.String()),
	payment: t.Optional(t.Any()),
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
					data: t.Array(OrderSchema),
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
					data: OrderSchema,
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
					data: OrderSchema,
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
					data: OrderSchema,
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
					data: OrderSchema,
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
