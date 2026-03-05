import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import rolesSchema from "./wallet_plans.schema";
import Admin from "src/models/drapp/Admin";
import WalletPlan from "src/models/WalletPlan";
import { createElysia } from "src/utils/createElysia";
import { ModuleId, Summary } from "src/config/modules";

export default createElysia({ prefix: "/wallet_plans" }).guard(
	{
		detail: {
			tags: ["Wallet Plans"],
			summary: Summary([ModuleId.WALLET]),
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

					const list = await WalletPlan.find({})
						.skip(page * size)
						.limit(page);

					const total = await WalletPlan.countDocuments({});

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
					const entry = await WalletPlan.create(body);

					return R("entry updated", entry);
				},
				rolesSchema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const entry = await WalletPlan.findByIdAndUpdate(query.id, body);

					return R("entry updated", entry);
				},
				rolesSchema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await WalletPlan.findByIdAndDelete(query.id);

					return R("entry updated", entry);
				},
				rolesSchema.delete,
			),
);
