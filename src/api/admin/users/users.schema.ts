import { t } from "elysia";
import { CategorySchema } from "../categories/categories.schema";
import { CountrySchema } from "../country/country.schema";

const name = "User";

export const UserSchema = t.Object({
	_id: t.Optional(t.String()),
	fname: t.Optional(t.String()),
	lname: t.Optional(t.String()),
	email: t.Optional(t.String()),
	phone: t.Optional(t.String()),
	password: t.Optional(t.String()),
	gender: t.Optional(t.String()),
	dob: t.Optional(t.String()),
	pob: t.Optional(t.String()),
	address: t.Optional(t.String()),
	photo: t.Optional(t.String()),
	token: t.Optional(t.String()),
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
					data: t.Array(UserSchema),
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
					data: UserSchema,
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
		body: t.Object({
			name: t.String(),
			permissions: t.Any(),
			super_admin: t.Boolean(),
			order: t.Number(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: UserSchema,
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
				permissions: t.Any(),
				super_admin: t.Boolean(),
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
					data: UserSchema,
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
					data: UserSchema,
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
