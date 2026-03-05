import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import rolesSchema from "./client.schema";
import Admin from "src/models/drapp/Admin";
import { createElysia } from "src/utils/createElysia";
import moment from "moment";
import Role from "src/models/Role";
import Client from "src/models/Client";

export default createElysia({ prefix: "/clients" }).guard(
	{
		detail: {
			tags: ["Client"],
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

					let search = query?.search;

					if (search) {
						search = new RegExp(search, "i") as any;
					}

					const list = await Client.find({
						...(search && {
							$or: [
								{
									name: {
										$regex: search,
									},
								},
							],
						}),
						// ...(!user.super_admin && {
						// 	parent: user._id.toString(),
						// }),
						// ...roleQuery,
					})
						// .select("-password")
						.skip(page * size)
						.limit(page)
						.sort({ createdAt: -1 })
						.lean();

					const total = await Client.countDocuments({
						...(search && {
							$or: [
								{
									name: {
										$regex: search,
									},
								},
							],
						}),
					});

					const pages = Math.ceil(total / size);

					return R("admin list data", list, true, {
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
				async ({ body, user }) => {
					let entry = await Client.findOne({
						name: body.name,
					});

					if (entry) {
						return customError("Duplicate Client Name");
					}

					entry = await Client.create({
						name: body.name,
					});

					return R("entry updated", entry);
				},
				rolesSchema.create,
			)
			.put(
				"/",
				async ({ body, query, user }) => {
					body.password = HashPassword(body.password_unhashed);

					if (body.expire_at) {
						body.expire_at = moment().add(body.expire_at, "days") as any;
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
						body,
					);

					if (!user.super_admin) {
						const children_count = await Admin.countDocuments({
							parent: user._id,
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
					const entry = await Admin.findOneAndDelete({
						_id: query.id,
						...(!user.super_admin && {
							parent: user._id.toString(),
						}),
					});

					return R("entry updated", entry);
				},
				rolesSchema.delete,
			),
);
