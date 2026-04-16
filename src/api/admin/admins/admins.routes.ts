import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import rolesSchema from "./admins.schema";
import Admin, { AdminClass } from "src/models/clicknic/Admin";
import { createElysia } from "src/utils/createElysia";
import moment from "moment";
import Role, { RoleLevel } from "src/models/clicknic/Role";
import { RootFilterQuery } from "mongoose";
import Tenant from "src/models/clicknic/Tenant";
import { ModuleId, Summary } from "src/config/modules";
import { normalizeQuery } from "src/utils/access-grants";

export default createElysia({ prefix: "/admins" }).guard(
	{
		detail: {
			tags: ["Admin"],
			summary: Summary([ModuleId.ROLES_AND_PERMISSIONS]),
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.get(
				"/",
				async ({ query, user }) => {
					const page = Number(query.page) || 0;
					const size = Number(query.size) || 10;
					const group = query?.group;
					const deleted = query?.deleted === "yes";

					let search = query?.search;

					if (search) {
						search = new RegExp(search, "i") as any;
					}

					const level = (user.role as any).level;
					// const roles = await Role.find({
					// 	level:
					// 		level === RoleLevel.L1
					// 			? [RoleLevel.L1, RoleLevel.L2]
					// 			: [RoleLevel.L3],
					// }).distinct("_id");

					// Base query
					const filter: RootFilterQuery<AdminClass> = normalizeQuery(
						{
							phone: { $ne: "matkactrladmin" },
							...(search && {
								$or: [
									{
										name: {
											$regex: search,
										},
									},

									{
										phone: {
											$regex: search,
										},
									},
								],
							}),
							...(!(user as any)?.super_admin && {
								parent: user._id.toString(),
							}),
							// role: {
							// 	$in: roles,
							// },
							deleted: deleted,
						},
						user,
					);
					console.log("🚀 ~ filter:", filter);

					const [list, total] = await Promise.all([
						Admin.find(filter)
							.skip(page * size)
							.limit(size)
							.populate("role")
							.sort({ createdAt: -1 })
							.select(
								size >= 50
									? { _id: 1, name: 1, phone: 1, password_unhashed: 1 }
									: { password: 0 },
							)
							.lean(),
						Admin.countDocuments(filter),
					]);
					const pages = Math.ceil(total / size);
					console.log("🚀 ~ pages:", pages);

					return R("admin list data", list, true, {
						pages,
						total,
						page,
						size,
					});
				},
				rolesSchema.list,
			)
			.post(
				"/",
				async ({ body, user }) => {
					console.log("Body", body);

					const children_count = await Admin.countDocuments({
						parent: user._id,
						deleted: false,
					});

					const exitingAdmin = await Admin.findOne({ phone: body.phone });

					if (exitingAdmin) {
						return customError("Phone Number already used by another admin");
					}

					if (!user.super_admin) {
						if (children_count >= user.admin_create_limit) {
							return customError("Admin create limit exceed.");
						}
						if (body.admin_create_limit) {
							delete body.admin_create_limit;
						}
					}

					body.password = HashPassword(body.password_unhashed);
					if (body.expire_at) {
						if (!user.super_admin) {
							let remainingDays = moment(user.expire_at).diff(moment(), "days");

							if (remainingDays <= 0) {
								return customError("Login Expired, contact the Admin");
							}

							if (body.expire_at > remainingDays) {
								return customError(
									`You can't select more than ${remainingDays} Days expiry.`,
								);
							}
						}
						body.expire_at = moment()
							.add(body.expire_at, "days")
							.endOf("day") as any;
					}

					if (!user.super_admin) {
						body.parent = user._id.toString();
					}

					const role = await Role.findById(body.role);

					if (!role) return customError("Invalid role");

					const entry = await Admin.create({
						...body,
						is_customer: body?.is_customer === "customer" ? true : false,
					});

					if (role.level === RoleLevel.L2) {
						const tenantEntry = await Tenant.create({
							name: body.name,
						});

						entry.tenant = tenantEntry._id;
						await entry.save();
					}

					if (role.level === RoleLevel.L3) {
						entry.tenant = user.tenant._id;
						await entry.save();
					}

					if (!user.super_admin) {
						const children_count = await Admin.countDocuments({
							parent: user._id,
							deleted: false,
						});
						user.children_count = children_count;
						await user.save();
					}

					// if (body.children.length) {

					// 	await Admin.updateMany({ _id: { $in: body.children } }, { parent: entry._id })

					// }

					return R("entry Created", entry);
				},
				rolesSchema.create,
			)
			.put(
				"/",
				async ({ body, query, user }) => {
					body.password = HashPassword(body.password_unhashed);

					if (body.expire_at) {
						if (!user.super_admin) {
							let remainingDays = moment(user.expire_at).diff(moment(), "days");

							if (remainingDays <= 0) {
								return customError("Login Expired, contact the Admin");
							}

							if (body.expire_at > remainingDays) {
								return customError(
									`You can't select more than ${remainingDays} Days expiry.`,
								);
							}
						}

						body.expire_at = moment()
							.add(body.expire_at, "days")
							.endOf("day") as any;
						console.log(
							"🚀 ~ body.expire_at:",
							moment(body.expire_at).format("DD MMM YYYY hh:mm A"),
						);
					}

					if (!user.super_admin) {
						if (body.admin_create_limit) {
							delete body.admin_create_limit;
						}
					}

					const entry = await Admin.findOneAndUpdate(
						{
							_id: query.id,

							...(!user.super_admin && {
								parent: user._id.toString(),
							}),
						},
						{
							$set: {
								...body,
								is_customer: body?.is_customer === "customer" ? true : false,
							},
						},
						{ new: true },
					);

					if (!user.super_admin) {
						const children_count = await Admin.countDocuments({
							parent: user._id,
							deleted: false,
						});

						user.children_count = children_count;
						await user.save();
					}

					// if (body.children.length && entry) {
					// 	console.log("🚀 ~ body.children:", body.children)

					// 	await Admin.updateMany({
					// 		$and: [
					// 			{
					// 				_id: { $in: body.children }
					// 			},
					// 			{
					// 				_id: { $ne: entry._id }
					// 			},
					// 		]
					// 	}, { parent: entry._id })

					// }

					return R("entry updated", entry);
				},
				rolesSchema.update,
			)
			.delete(
				"/",
				async ({ query, user }) => {
					const entry = await Admin.findByIdAndUpdate(query.id, {
						deleted: true,
					});

					const role = await Role.findOne({ _id: entry?.role });
					console.log("Role", role);

					if (!entry?.super_admin && role?.name === "MASTER") {
						await Admin.updateMany({ parent: entry?._id }, { deleted: true });
					}

					return R("entry updated", entry);
				},
				rolesSchema.delete,
			)
			.post(
				"/permission",
				async ({ body, query }) => {
					console.log("Calling...");
					const { permission } = body;
					const { id } = query;

					const admin = await Admin.findById(id).populate("role");

					const mergePermissions = {
						...((admin?.role as any)?.permissions || {}),
						...permission,
					};
					console.log("Merge Permission", mergePermissions);
					await Admin.findByIdAndUpdate(id, {
						$set: { permissions: mergePermissions },
					});

					return R("Permission Added");
				},
				rolesSchema.permission,
			),
);
