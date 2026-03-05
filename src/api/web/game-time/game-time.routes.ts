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
import Role from "src/models/Role";
import moment from "moment";
import { RootFilterQuery } from "mongoose";
import Game from "src/models/Game";
import { ModuleId, Summary } from "src/config/modules";
import GroupGameTime from "src/models/GroupGameTime";
import Result from "src/models/Result";
import GameNumber from "src/models/GameNumber";

export default createElysia({ prefix: "/game-time" }).guard(
	{
		detail: {
			tags: ["GameTime"],
			summary: Summary([ModuleId.GAME]),
		},
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

			.get(
				"/detail",
				async ({ query }) => {
					const gameTime = await GameTime.findById(query.id)
						.populate([
							{
								path: "game",
								select: {
									_id: 1,
									name: 1,
								},
							},
						])
						.select({
							_id: 1,
							game: 1,
							start: 1,
							end: 1,
						})
						.lean();
					if (!gameTime) return customError("invalid game time");

					const numbers = await GameNumber.find({
						game: gameTime.game._id,
					})
						.populate([{ path: "number", select: { _id: 1, text: 1 } }])
						.lean();

					const todayStart = moment().startOf("day").toDate();
					const todayEnd = moment().endOf("day").toDate();

					const result = await Result.findOne({
						game_time: gameTime._id,
						date: { $gte: todayStart, $lte: todayEnd },
					}).lean();

					const start = moment()
						.startOf("day")
						.add(gameTime.start, "minutes")
						.toDate();
					const end = moment()
						.startOf("day")
						.add(gameTime.end, "minutes")
						.toDate();
					const diff = moment(end).diff(moment(), "seconds");
					const data = {
						_id: gameTime._id,
						game: gameTime.game,
						start: start,
						end: end,
						remaining_seconds: diff,
						numbers: numbers.filter(
							(f) => f.game.toString() === gameTime.game?._id.toString(),
						),
						result_id: diff <= 0 && result ? result?.number.toString() : "",
					};

					return R(`${name} detail`, data);
				},
				schema.detail,
			)
			.get(
				"/history",
				async ({ query }) => {
					const targetDate = moment(query.date);
					if (!targetDate.isValid()) return customError("invalid date");

					const monthStart = targetDate.clone().startOf("month").startOf("day");
					const monthEnd = targetDate.clone().endOf("month").endOf("day");

					const gameTime = await GameTime.findById(query.id)
						.populate([{ path: "game", select: { _id: 1, name: 1 } }])
						.select({ _id: 1, game: 1, start: 1, end: 1 })
						.lean();
					if (!gameTime) return customError("invalid game time");

					const numbers = await GameNumber.find({
						game: (gameTime as any).game?._id,
					})
						.populate([{ path: "number", select: { _id: 1, text: 1 } }])
						.lean();

					const start = targetDate
						.clone()
						.startOf("day")
						.add(gameTime.start, "minutes")
						.toDate();
					const end = targetDate
						.clone()
						.startOf("day")
						.add(gameTime.end, "minutes")
						.toDate();

					const monthResults = await Result.find({
						game_time: gameTime._id,
						date: { $gte: monthStart.toDate(), $lte: monthEnd.toDate() },
					})
						.populate([{ path: "number", select: { _id: 1, text: 1 } }])
						.lean();

					const resultMap = new Map<string, { text: string; id: string }>();
					for (const entry of monthResults) {
						const key = moment(entry.date).format("YYYY-MM-DD");
						const number = (entry as any).number as any;
						const text =
							typeof number === "object" && number?.text ? number.text : "";
						const id =
							typeof number === "object" && number?._id
								? number._id.toString()
								: number?.toString?.() ?? "";
						resultMap.set(key, { text, id });
					}

					const frequencies: Record<string, number> = {};
					let mostFrequent = "";
					const results: { date: string; result_text: string }[] = [];
					const now = moment();
					const cursor = monthStart.clone();
					while (cursor.isSameOrBefore(monthEnd, "day")) {
						const key = cursor.format("YYYY-MM-DD");
						const mapped = resultMap.get(key);
						const resultText = mapped?.text ?? "";
						const isToday = cursor.isSame(now, "day");
						const endTime = cursor
							.clone()
							.startOf("day")
							.add(gameTime.end, "minutes");
						const effectiveResultText =
							isToday && endTime.isAfter(now) ? "" : resultText;

						results.push({
							date: cursor.toDate().toISOString(),
							result_text: effectiveResultText,
						});

						if (effectiveResultText) {
							frequencies[effectiveResultText] =
								(frequencies[effectiveResultText] || 0) + 1;
							if (
								!mostFrequent ||
								frequencies[effectiveResultText] >
									(frequencies[mostFrequent] || 0)
							) {
								mostFrequent = effectiveResultText;
							}
						}

						cursor.add(1, "day");
					}

					const selectedResult = resultMap.get(targetDate.format("YYYY-MM-DD"));

					const data = {
						game_time: {
							_id: gameTime._id,
							game: gameTime.game,
							start,
							end,
							remaining_seconds: 0,
							numbers: numbers,
							result_id: selectedResult?.id ?? "",
						},
						date: targetDate.toDate().toISOString(),
						results,
						total_results: results.filter((f) => f.result_text).length,
						most_frequent: mostFrequent,
					};

					return R(`${name} history`, data);
				},
				schema.history,
			),
);
