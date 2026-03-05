import { t } from "elysia";
import { RoleSchema } from "../roles/roles.schema";

const adminSchema = t.Object({
	_id: t.String(),
	name: t.String(),
	phone: t.Optional(t.String()),
	email: t.Optional(t.String()),
	createdAt: t.String(),
	updatedAt: t.String(),
	status: t.Number(),
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
			// page: t.Numeric(),
			// size: t.Numeric(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(adminSchema),
					meta: MetaPaginationSchema,
				},
				{
					description: "admins Response",
				},
			),
		},
		detail: {
			operationId: "adminList",
		},
	},
	create: {
		body: t.Object({
			name: t.String(),
			phone: t.String(),
			password_unhashed: t.String(),
			password: t.Optional(t.String()),
			role: t.String(),
			// children: t.Array(t.String()),
			parent: t.Optional(t.String()),
			expire_at: t.Optional(t.Numeric()),
			admin_create_limit: t.Optional(t.Numeric()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: adminSchema,
				},
				{
					description: "admins Response",
				},
			),
		},
		detail: {
			operationId: "adminCreate",
		},
	},
	update: {
		body:
			t.Object({
				status: t.String(),
			}),
		query: t.Object({
			id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: adminSchema,
				},
				{
					description: "admins Response",
				},
			),
		},
		detail: {
			operationId: "adminUpdate",
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
					data: adminSchema,
				},
				{
					description: "admins Response",
				},
			),
		},
		detail: {
			operationId: "adminDelete",
		},
	},
};
