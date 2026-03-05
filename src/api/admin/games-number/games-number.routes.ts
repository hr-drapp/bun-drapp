import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import gamesSchema, { name } from "./games-number.schema";
import Admin from "src/models/drapp/Admin";
import GameNumber, { GameNumberClass } from "src/models/GameNumber";
import { createElysia } from "src/utils/createElysia";
import { convertMinutes } from "src/utils/common";
import Role from "src/models/Role";
import moment from "moment";
import { RootFilterQuery, Types } from "mongoose";
import GameTime from "src/models/GameTime";
import { ModuleId, Summary } from "src/config/modules";
import GameCategory from "src/models/GameCategory";

export default createElysia({ prefix: "/game-number" }).guard(
	{
		detail: {
			tags: ["GameNumber"],
			summary: Summary([ModuleId.GAME]),
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.get(
				"/",
				async (ctx) => {
					const page = parseInt(ctx.query.page || "0");
					const size = parseInt(ctx.query.size || "10");
					const game = ctx.query.game;

					const filter: RootFilterQuery<GameNumberClass> = { game: game };

					const list = await GameNumber.find(filter)
						.populate("number")
						.populate("game")
						.skip(page * size)
						.limit(size)
						.sort({ updatedAt: -1 })
						.lean();

					const total = await GameNumber.countDocuments(filter);

					const pages = Math.ceil(total / size);

					return R(`${name} list data`, list, true, {
						pages: pages,
						total: total,
						page: page,
						size: size,
					});
				},
				gamesSchema.list,
			)
			.post(
				"/",
				async ({ body }) => {
					const duplicateCount = await GameNumber.countDocuments(body);

					if (duplicateCount > 0) {
						return customError("already added to the game");
					}

					const entry = await GameNumber.create(body);

					return R("entry updated", entry);
				},
				gamesSchema.create,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await GameNumber.findByIdAndDelete(query.id);
					// console.log("Entry",entry)
					return R("entry updated", entry);
				},
				gamesSchema.delete,
			),
);
