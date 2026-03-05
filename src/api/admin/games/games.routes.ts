import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import gamesSchema from "./games.schema";
import Admin from "src/models/drapp/Admin";
import Game, { GameClass } from "src/models/Game";
import { createElysia } from "src/utils/createElysia";
import { convertMinutes } from "src/utils/common";
import Role from "src/models/Role";
import moment from "moment";
import { RootFilterQuery, Types } from "mongoose";
import GameTime from "src/models/GameTime";
import { ModuleId, Summary } from "src/config/modules";
import GameCategory from "src/models/GameCategory";

export default createElysia({ prefix: "/games" }).guard(
	{
		detail: {
			tags: ["Game"],
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

					const filter: RootFilterQuery<GameClass> = { deleted: false };

					const list = await Game.find(filter)
						.skip(page * size)
						.limit(size)
						.lean();

					const total = await Game.countDocuments(filter);

					const pages = Math.ceil(total / size);

					return R("game list data", list, true, {
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
					const entry = await Game.create(body);

					/**  */
					CountTotalGames(entry!.game_category!);
					/**  */

					return R("entry updated", entry);
				},
				gamesSchema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					console.log("🚀~~ Body:", body);

					const entry = await Game.findByIdAndUpdate(query.id, body!, {
						new: true,
					});

					/**  */
					CountTotalGames(entry!.game_category!);
					/**  */

					return R("entry updated", entry);
				},
				gamesSchema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					const gameTimeExits = await GameTime.find({
						game: query?.id,
						deleted: false,
					});

					if (gameTimeExits.length > 0) {
						return customError(
							"Before Delete The Game, Please Delete its Game Times ",
						);
					}
					const entry = await Game.findById(query.id);

					if (!entry) return customError("Invalid game");

					entry.deleted = true;
					await entry.save();

					/**  */
					CountTotalGames(entry!.game_category!);
					/**  */

					return R("entry updated", entry);
				},
				gamesSchema.delete,
			),
);

async function CountTotalGames(gameCategoryId: string | Types.ObjectId | any) {
	/**  */
	const gameCount = await Game.countDocuments({
		game_category: gameCategoryId,
	});

	await GameCategory.findByIdAndUpdate(gameCategoryId, {
		total_count: gameCount,
	});
	/**  */
}
