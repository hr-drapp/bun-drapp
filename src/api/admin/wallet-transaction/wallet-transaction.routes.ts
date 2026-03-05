import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import gamesSchema from "./wallet-transaction.schema";
import Admin from "src/models/drapp/Admin";
import WalletTransaction, {
	WalletTransactionClass,
} from "src/models/WalletTransaction";
import { createElysia } from "src/utils/createElysia";
import { convertMinutes } from "src/utils/common";
import Role from "src/models/Role";
import moment from "moment";
import { RootFilterQuery, Types } from "mongoose";
import GameTime from "src/models/GameTime";
import { ModuleId, Summary } from "src/config/modules";
import GameCategory from "src/models/GameCategory";

export default createElysia({ prefix: "/wallet-transaction" }).guard(
	{
		detail: {
			tags: ["wallet-transaction"],
			summary: Summary([ModuleId.WALLET]),
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app.get(
			"/",
			async (ctx) => {
				const page = parseInt(ctx.query.page || "0");
				const size = parseInt(ctx.query.size || "10");
				const wallet = ctx.query.wallet;

				const filter: RootFilterQuery<WalletTransactionClass> = {
					wallet: wallet,
				};

				const list = await WalletTransaction.find(filter)
					.skip(page * size)
					.limit(size)
					.sort({ createdAt: -1 });

				const total = await WalletTransaction.countDocuments(filter);

				const pages = Math.ceil(total / size);

				return R("wallet transaction list data", list, true, {
					pages: pages,
					total: total,
					page: page,
					size: size,
				});
			},
			gamesSchema.list,
		),
);
