import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import rolesSchema from "./country.schema";
import Admin from "src/models/drapp/Admin";
import CountryClass from "src/models/Country";
import { createElysia } from "src/utils/createElysia";

export default createElysia({ prefix: "/countries" }).guard(
	{
		detail: {
			tags: ["Country"],
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.get(
				"/",
				async ({ query }) => {
					const page = parseInt(query.page);
					const size = parseInt(query.size);

					const list = await CountryClass.find({})
						.skip(page * size)
						.limit(page);

					const total = await CountryClass.countDocuments({});

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
					const entry = await CountryClass.create(body);

					return R("entry updated", entry);
				},
				rolesSchema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const entry = await CountryClass.findByIdAndUpdate(query.id, body);

					return R("entry updated", entry);
				},
				rolesSchema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await CountryClass.findByIdAndDelete(query.id);

					return R("entry updated", entry);
				},
				rolesSchema.delete,
			),
);
