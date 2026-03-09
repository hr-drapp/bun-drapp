import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import {
	AdminForgotSchema,
	AdminLoginSchema,
	AdminMeSchema,
	AdminRegisterSchema,
	AdminResetForgotSchema,
	AdminResetPasswordSchema,
	AdminSchema,
} from "./auth.schema";
import Admin from "src/models/drapp/Admin";
import Role from "src/models/drapp/Role";
import { createElysia } from "src/utils/createElysia";
import moment from "moment";
import { sendMail } from "src/utils/mailer";
import otp from "src/utils/otp";

export default createElysia({ prefix: "/auth" }).guard(
	{
		detail: {
			tags: ["Auth"],
		},
	},
	(app) =>
		app
			.post(
				"/login",
				async ({ body, request }) => {
					const clientIP = request.headers.get("x-forwarded-for");
					console.log("🚀 ~ clientIP:", clientIP);
					const origin = request.headers.get("Origin") || "";
					console.log("🚀 ~ origin:", origin);
					console.log("phoneNumber", body);
					const user = await Admin.findOne({
						phone: body.phone,
						deleted: false,
					}).populate("role");

					if (!user) {
						return customError("Invalid credentials.");
					}

					if (!VerifyPassword(body.password, user.password)) {
						return customError("Invalid credentials");
					}

					if (user.expire_at) {
						let remainingDays = moment(user.expire_at).diff(moment(), "days");

						if (remainingDays <= 0) {
							return customError("Login Expired, contact the Admin");
						}
					}

					if (!origin.includes("localhost")) {
						if (user.super_admin) {
							if (!origin.includes("myroj-dashboard.vercel.app")) {
								return customError("Not allowed.");
							}
						} else {
							if (origin.includes("myroj-dashboard.vercel.app")) {
								return customError("Not allowed.");
							}
						}
					}

					user.ip = clientIP || "";
					await user.save();

					let u: Record<string, any> = user.toObject();

					u.token = jwt.sign({ _id: u._id, email: u.email, phone: u.phone });

					if (Object.keys(u?.permissions ?? {}).length > 0) {
						(u.role as any).permissions = {
							...(u.role as any).permissions,
							...u.permissions,
						};
					}

					return R("Logged in successfully.", u);
				},
				AdminLoginSchema,
			)
			.post(
				"/reset-password",
				async ({ body, request, user }) => {
					user.password = HashPassword(body.password);
					user.password_unhashed = body.password;
					user.password_changed = true;

					await user.save();

					return R("password reset successfully.");
				},
				AdminResetPasswordSchema,
			)
			.post(
				"/forgot-password",
				async ({ body, request, user }) => {
					console.log("Forgot Body", body);

					const entry = await Admin.findOne({
						email: body.email,
					});

					if (!entry) {
						return customError("Invalid Email.");
					}

					const code = otp.generate(6, {});

					entry.otp = code;
					await entry.save();

					await sendMail({
						subject: "Forgot Password - OTP",
						to: entry.email || "",
						text: `OTP - ${code}`,
					});

					return R("Email sent successfully.", entry);
				},
				AdminForgotSchema,
			)
			.post(
				"/reset-forgot-password",
				async ({ body, request, user }) => {
					const entry = await Admin.findOne({
						email: body.email,
					});

					if (!entry) {
						return customError("Invalid Email.");
					}

					if (body.otp !== entry.otp) {
						return customError("Invalid OTP.");
					}

					entry.password = HashPassword(body.password);
					entry.password_unhashed = body.password;

					await entry.save();

					return R("Password reset successfully.", entry);
				},
				AdminResetForgotSchema,
			)
			.get(
				"/me",
				async (ctx) => {
					const user = await Admin.findById(ctx.user._id)
						.populate("role")
						.lean();

					if (!user) {
						return customError("Invalid credentials.");
					}

					if (user.expire_at) {
						let remainingDays = moment(user.expire_at).diff(moment(), "days");

						if (remainingDays <= 0) {
							return customError("Login Expired, contact the Admin");
						}
					}

					if (Object.keys(user?.permissions ?? {}).length > 0) {
						(user.role as any).permissions = {
							...(user.role as any).permissions,
							...user.permissions,
						};
					}

					return R("admin data", user);
				},
				{
					beforeHandle: isAdminAuthenticated,
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
				} as any,
			),

	// .get("/add-test-admin", async ({ body }) => {
	// 	let role = await Role.findOne({
	// 		name: "SUPER ADMIN",
	// 		super_admin: true,
	// 	});

	// 	if (!role) {
	// 		role = await Role.create({
	// 			name: "SUPER ADMIN",
	// 			super_admin: true,
	// 		});
	// 	}

	// 	let admin = await Admin.findOne({
	// 		phone: "9983396152",
	// 	});

	// 	if (!admin) {
	// 		admin = await Admin.create({
	// 			name: "Super Admin",
	// 			password: HashPassword("Admin@123"),
	// 			phone: "9983396152",
	// 			role: role.id,
	// 			super_admin: true,
	// 		});
	// 	}

	// 	return R("Logged in successfully.", admin);
	// }),
);
