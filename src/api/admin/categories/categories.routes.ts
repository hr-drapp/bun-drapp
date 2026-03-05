import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import rolesSchema from "./categories.schema";
import Admin from "src/models/drapp/Admin";
import Category, { CategoryClass } from "src/models/Category";
import { createElysia } from "src/utils/createElysia";
import { uploadFile } from "src/utils/upload";

export default createElysia({ prefix: "/categories" }).guard(
	{
		detail: {
			tags: ["Category"],
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

					const doc_query: any = {};

					const list = await Category.find()
						.skip(page * size)
						.limit(page)
						.populate("role");

					const total = await Category.countDocuments({});

					const pages = Math.ceil(total / size);

					return R("list data", list, true, {
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
					const { name } = await uploadFile(body.photo);
					body.photo = name as any;
					const entry = await Category.create(body);

					return R("entry updated", entry);
				},
				rolesSchema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					if (body.photo) {
						const { name } = await uploadFile(body.photo);
						body.photo = name as any;
					}

					const entry = await Category.findByIdAndUpdate(query.id, body);

					return R("entry updated", entry);
				},
				rolesSchema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await Category.findByIdAndDelete(query.id);

					return R("entry updated", entry);
				},
				rolesSchema.delete,
			),
);
