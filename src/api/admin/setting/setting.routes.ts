import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import rolesSchema from "./setting.schema";
import Admin from "src/models/drapp/Admin";
import Setting from "src/models/Setting";
import { createElysia } from "src/utils/createElysia";

export default createElysia({ prefix: "/setting" }).guard(
	{
		detail: {
			tags: ["Setting"],
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.get(
				"/",
				async ({ query }) => {
					const list = await Setting.find({});

					const obj = {};

					for (let item of list) {
						(obj as any)[item.key] = item;
					}

					return R("setting list data", obj);
				},
				rolesSchema.list,
			)

			.post(
				"/",
				async ({ body }) => {
					let entry = await Setting.findOne({
						key: body.key,
					});
					if (!entry) {
						entry = await Setting.create(body);
					} else {
						entry.value = body.value;
						entry.name = body.name;
						await entry.save();
					}

					return R("entry updated", entry);
				},
				rolesSchema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const entry = await Setting.findByIdAndUpdate(query.id, body);

					return R("entry updated", entry);
				},
				rolesSchema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await Setting.findByIdAndDelete(query.id);

					return R("entry updated", entry);
				},
				rolesSchema.delete,
			),
);
