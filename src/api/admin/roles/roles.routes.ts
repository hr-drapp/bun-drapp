import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import rolesSchema from "./roles.schema";
import Admin from "src/models/clicknic/Admin";
import Role, { RoleClass } from "src/models/clicknic/Role";
import { createElysia } from "src/utils/createElysia";
import { RootFilterQuery } from "mongoose";
import { ModuleId, Summary } from "src/config/modules";

export default createElysia({ prefix: "/roles" }).guard(
	{
		detail: {
			tags: ["Role"],
			summary: Summary([ModuleId.ROLES_AND_PERMISSIONS]),
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.get(
				"/",
				async ({ query, user }) => {
					const page = parseInt(query.page);
					const size = parseInt(query.size);

					const filter: RootFilterQuery<RoleClass> = {
						name: {
							$ne: "SUPER ADMIN",
						},

						...(!user.super_admin && {
							_id: {
								$ne: user.role._id.toString(),
							},
						}),
					};

					const [list, total] = await Promise.all([
						Role.find(filter)
							.skip(page * size)
							.limit(page),
						Role.countDocuments(filter),
					]);
					console.log("🚀 ~ list:", list);

					const pages = Math.ceil(total / size);

					return R("role list data", list, true, {
						pages: pages,
						total: total,
						page: page,
						size: size,
					});
				},
				rolesSchema.list,
			)

			.post(
				"/",
				async ({ body }) => {
					console.log("body data", body);
					const entry = await Role.create(body);

					return R("entry updated", entry);
				},
				rolesSchema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const entry = await Role.findByIdAndUpdate(query.id, body);

					return R("entry updated", entry);
				},
				rolesSchema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await Role.findByIdAndDelete(query.id);

					return R("entry updated", entry);
				},
				rolesSchema.delete,
			),
);
