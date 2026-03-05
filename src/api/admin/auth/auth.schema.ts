import { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { RoleSchema } from "../roles/roles.schema";

export const AdminSchema = t.Object({
	_id: t.String(),
	phone: t.Optional(t.String()),
	password: t.Optional(t.String()),
	token: t.Optional(t.String()),
	name: t.Optional(t.String()),
	email: t.Optional(t.String()),
	role: RoleSchema,
});

export const AdminLoginSchema = {
	body: t.Object({
		phone: t.String(),
		password: t.String(),
	}),
	response: {
		200: t.Object(
			{
				status: t.Boolean(),
				message: t.String(),
				data: t.Any(AdminSchema),
			},
			{
				description: "Login Response",
			},
		),
	},
	detail: {
		operationId: "login",
	},
};

export const AdminResetPasswordSchema = {
	body: t.Object({
		password: t.String(),
	}),
	response: {
		200: t.Object(
			{
				status: t.Boolean(),
				message: t.String(),
				data: AdminSchema,
			},
			{
				description: "Reset Password Response",
			},
		),
	},
	detail: {
		operationId: "resetPassword",
	},
	beforeHandle: isAdminAuthenticated as any,
};

export const AdminRegisterSchema = {
	body: t.Object({
		name: t.String(),
		phone: t.String(),
		email: t.String(),
	}),
	response: {
		200: t.Object(
			{
				status: t.Boolean(),
				message: t.String(),
				data: AdminSchema,
			},
			{
				description: "Register Response",
			},
		),
	},
	detail: {
		operationId: "register",
	},
};

export const AdminForgotSchema = {
	body: t.Object({
		email: t.String(),
	}),
	response: {
		200: t.Object(
			{
				status: t.Boolean(),
				message: t.String(),
				data: AdminSchema,
			},
			{
				description: "Forgot Password Response",
			},
		),
	},
	detail: {
		operationId: "forgot",
	},
};

export const AdminResetForgotSchema = {
	body: t.Object({
		email: t.String(),
		password: t.String(),
		otp: t.String(),
	}),
	response: {
		200: t.Object(
			{
				status: t.Boolean(),
				message: t.String(),
				data: AdminSchema,
			},
			{
				description: "Reset Forgot Password Response",
			},
		),
	},
	detail: {
		operationId: "reset_forgot",
	},
};

export const AdminMeSchema = {
	response: {
		200: t.Object(
			{
				status: t.Boolean(),
				message: t.String(),
				data: AdminSchema,
			},
			{
				description: "me Response",
			},
		),
	},
	detail: {
		operationId: "me",
	},
};
