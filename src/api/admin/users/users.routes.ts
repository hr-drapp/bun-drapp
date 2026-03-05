import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import astrologersSchema from "./users.schema";
import Admin from "src/models/drapp/Admin";
import User from "src/models/User";
import { createElysia } from "src/utils/createElysia";

export default createElysia({ prefix: "/users" }).guard(
	{
		detail: {
			tags: ["User"],
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

					const list = await User.find({})
						.skip(page * size)
						.limit(page);

					const total = await User.countDocuments({});

					const pages = Math.ceil(total / size);

					return R("user list data", list, true, {
						pages: pages,
						total: total,
						page: page,
						size: size,
					});
				},
				astrologersSchema.list,
			)
			.get(
				"/detail",
				async ({ query }) => {
					const { id } = query;

					const entry = await User.findById(id);

					if (!entry) {
						return customError("no found");
					}

					//

					await entry?.populate([
						{
							path: "category",
						},
						{
							path: "sub_category",
						},
						{
							path: "country",
						},
					]);

					return R("user detail", entry);
				},
				astrologersSchema.detail,
			)

			.post(
				"/",
				async ({ body }) => {
					const entry = await User.create(body);

					return R("entry updated", entry);
				},
				astrologersSchema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const entry = await User.findByIdAndUpdate(query.id, body);

					return R("entry updated", entry);
				},
				astrologersSchema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await User.findByIdAndDelete(query.id);

					return R("entry updated", entry);
				},
				astrologersSchema.delete,
			),
);
