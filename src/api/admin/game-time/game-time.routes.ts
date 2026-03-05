import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import schema, { name } from "./game-time.schema";
import Admin from "src/models/drapp/Admin";
import GameTime, { GameTimeClass } from "src/models/GameTime";
import { createElysia } from "src/utils/createElysia";
import { convertMinutes } from "src/utils/common";
import Role from "src/models/Role";
import moment from "moment";
import { RootFilterQuery } from "mongoose";
import Game from "src/models/Game";
import { ModuleId, Summary } from "src/config/modules";
import GroupGameTime from "src/models/GroupGameTime";
import Result from "src/models/Result";

export default createElysia({ prefix: "/game-time" }).guard(
	{
		detail: {
			tags: ["GameTime"],
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
					const group = ctx.query?.group;
					const search = ctx.query.search;

					let filter: RootFilterQuery<GameTimeClass> = { deleted: false };

					if (game) {
						filter.game = game;
					}

					if (search) {
						const games = await Game.find({
							name: { $regex: search, $options: "i" },
						}).select("_id");

						filter.game = { $in: games?.map((g) => g._id) };
					}

					const list = await GameTime.find(filter)
						.skip(page * size)
						.limit(size)
						.sort({
							createdAt: -1,
						})
						.populate("game", "_id name")
						.lean();

					const total = await GameTime.countDocuments(filter);

					const pages = Math.ceil(total / size);

					/**
					 * Additoinal operations for checking group assigned or not.
					 */
					if (group) {
						const groupGameTimes = await GroupGameTime.find({
							group: group,
							game_time: {
								$in: list.map((item) => item._id),
							},
						}).lean();

						for (let item of list) {
							(item as any).group_game_time = groupGameTimes.find(
								(f) => f.game_time!.toString() === item._id.toString(),
							)?._id;
						}
					}

					return R(`${name} list data`, list, true, {
						pages: pages,
						total: total,
						page: page,
						size: size,
					});
				},
				schema.list,
			)
			.post(
				"/",
				async ({ body }) => {
					if (body.entry_margin) {
						body.entry_margin = body.end - body.entry_margin;
					}

					if (body.result_margin) {
						body.result_margin = body.end + body.result_margin;
					}

					const entry = await GameTime.create(body);

					return R(`${name} updated`, entry);
				},
				schema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const entry = await GameTime.findByIdAndUpdate(query.id, body!, {
						new: true,
					});
					return R(`${name} updated`, entry);
				},
				schema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await GameTime.findById(query.id);
					if (!entry) return customError("invalid game time");

					entry.deleted = true;
					await entry.save();

					return R(`${name} updated`, entry);
				},
				schema.delete,
			)
			.get(
				"/time-out-game",
				async () => {
					const now = moment();
					const currentTime = now.hours() * 60 + now.minutes();

					let filter = {
						$expr: {
							$lt: [{ $subtract: ["$end", "$entry_margin"] }, currentTime],
						},
					};

					const list = await GameTime.find(filter)
						.populate("game", "_id name")
						.lean();

					return R(`${name}Out List`, list);
				},
				schema.timeout_game,
			)
			.get(
				"/result-games",
				async (ctx) => {
					const today = moment();

					const dateRange = {
						$gte: ctx.query.dateFrom || today.startOf("day").toDate(),
						$lte: ctx.query.dateTo || today.endOf("day").toDate(),
					};

					const list = await Result.find({
						date: dateRange,
					}).populate({
						path: "game_time",
						populate: {
							path: "game",
						},
					});

					return R("result Annouced Games", list);
				},
				schema.result_game,
			)
			.post(
				"/auto-result",
				async ({ query }) => {
					const { id } = query;

					const gameTime = await GameTime.findById(id);
					if (!gameTime) return customError("Game Time not found");

					if (gameTime.win_margin === 0)
						return customError("Please Add Win Margin Then On Auto Result");
					gameTime.auto_result = !gameTime.auto_result;
					await gameTime.save();
					return R(`${name} Auto Result on`, gameTime);
				},
				schema.auto_result,
			)
			.post(
				"/win-margin",
				async (ctx) => {
					console.log("Body", ctx.body);
					const win_margin = ctx.body.win_margin;
					const id = ctx.query.id;

					const gameTime = await GameTime.findByIdAndUpdate(
						{ _id: id },
						{
							$set: {
								win_margin: win_margin,
							},
						},
					);
					return R(`${name} Win Margin Added`, gameTime);
				},
				schema.win_margin,
			),
);
