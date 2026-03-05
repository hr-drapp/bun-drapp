import { isAdminAuthenticated } from "src/guard/auth.guard";
import { R } from "src/utils/response-helpers";
import schema, { name } from "./home.schema";
import GameTime, { GameTimeClass } from "src/models/GameTime";
import { createElysia } from "src/utils/createElysia";
import moment from "moment";
import { RootFilterQuery } from "mongoose";
import Game from "src/models/Game";
import { ModuleId, Summary } from "src/config/modules";
import GroupGameTime from "src/models/GroupGameTime";
import GameNumber from "src/models/GameNumber";
import Result, { ResultClass } from "src/models/Result";

export default createElysia({ prefix: "/home" }).guard(
	{
		detail: {
			tags: ["Home"],
			summary: Summary([ModuleId.GAME]),
		},
	},
	(app) =>
		app
			.get(
				"/home-data",
				async (ctx) => {
					const now = moment();
					const currentMinutes = now.diff(
						now.clone().startOf("day"),
						"minutes",
					);
					const todayStart = now.clone().startOf("day").toDate();
					const todayEnd = now.clone().endOf("day").toDate();

					const liveFilter: RootFilterQuery<GameTimeClass> = {
						start: { $lte: currentMinutes },
						end: { $gte: currentMinutes },
						result_margin: { $gte: currentMinutes },
						deleted: false,
					};

					const upcomingFilter: RootFilterQuery<GameTimeClass> = {
						start: { $gt: currentMinutes },
						deleted: false,
					};

					const liveGameTimesPromise = GameTime.find(liveFilter)
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
							auto_result: 1,
							win_margin: 1,
						})
						.lean();

					const upcomingGameTimesPromise = GameTime.find(upcomingFilter)
						.populate({
							path: "game",
							select: { _id: 1, name: 1 },
						})
						.select({
							_id: 1,
							game: 1,
							start: 1,
							end: 1,
						})
						.sort({ start: 1 })
						.lean();

					const recentResultsPromise = Result.find({
						date: { $gte: todayStart, $lte: todayEnd },
					})
						.populate([
							{
								path: "game_time",
								select: "_id game end",
								populate: {
									path: "game",
									select: "name",
								},
							},
							{
								path: "number",
								select: "text",
							},
						])
						.sort({
							createdAt: -1,
						});

					const [liveGameTimes, upcomingGameTimes, recentResults] =
						await Promise.all([
							liveGameTimesPromise,
							upcomingGameTimesPromise,
							recentResultsPromise,
						]);

					const liveGameTimeIds: string[] = [];
					const liveGameIds: string[] = [];

					for (const item of liveGameTimes) {
						if (!liveGameTimeIds.includes(item?._id.toString())) {
							liveGameTimeIds.push(item?._id.toString());
						}

						if (
							item.game?._id &&
							!liveGameIds.includes(item.game?._id.toString())
						) {
							liveGameIds.push(item.game._id.toString());
						}
					}

					const [numbers, liveResults] = await Promise.all([
						GameNumber.find({
							game: {
								$in: liveGameIds,
							},
						})
							.populate([{ path: "number", select: { _id: 1, text: 1 } }])
							.lean(),
						Result.find({
							game_time: {
								$in: liveGameTimeIds,
							},
						}).lean(),
					]);

					const liveGamesList = [];

					for (const item of liveGameTimes) {
						if (!item.game) continue;

						const start = moment().startOf("day").add(item.start, "minutes");
						const end = moment().startOf("day").add(item.end, "minutes");
						const diff = end.diff(moment(), "seconds");

						liveGamesList.push({
							_id: item._id,
							game: item.game,
							start: start.toDate(),
							end: end.toDate(),
							remaining_seconds: diff,
							numbers: numbers.filter(
								(f) => f.game.toString() === item.game?._id.toString(),
							),
							result_id:
								liveResults
									.find(
										(f) =>
											f.game_time.toString() === item._id.toString() &&
											diff <= 0,
									)
									?.number.toString() || "",
							auto_result: item.auto_result,
							win_margin: item.win_margin,
						});
					}

					const upcomingGamesList: any[] = [];

					for (const item of upcomingGameTimes) {
						if (!item.game) continue;

						const startDate = moment()
							.startOf("day")
							.add(item.start, "minutes");

						const endDate = moment().startOf("day").add(item.end, "minutes");

						const remainingSeconds = startDate.diff(moment(), "seconds");

						upcomingGamesList.push({
							_id: item._id,
							game: item.game,
							start: startDate.toDate(),
							end: endDate.toDate(),
							remaining_seconds: remainingSeconds > 0 ? remainingSeconds : 0,
							numbers: [],
							result_id: "",
						});
					}

					const data = {
						liveGames: liveGamesList,
						recentResults: recentResults,
						upcomingGames: upcomingGamesList,
					};

					return R("home data", data, true);
				},
				schema.home_data,
			)
			.get(
				"/idle-games",
				async (ctx) => {
					const currentMinutes = moment().diff(
						moment().startOf("day"),
						"minutes",
					);

					const filter: RootFilterQuery<GameTimeClass> = {
						end: { $lt: currentMinutes },
						deleted: false,
					};

					const gameTimes = await GameTime.find(filter)
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
							auto_result: 1,
							win_margin: 1,
						})
						.lean();

					const list = [];

					const gameTimeIds: string[] = [];
					const gameIds: string[] = [];

					for (let item of gameTimes) {
						if (!gameTimeIds.includes(item?._id.toString())) {
							gameTimeIds.push(item?._id.toString());
						}

						if (
							item.game?._id &&
							!gameIds.includes(item.game?._id.toString())
						) {
							gameIds.push(item.game._id.toString());
						}
					}

					const results = await Result.find({
						game_time: {
							$in: gameTimeIds,
						},
					}).lean();

					for (let item of gameTimes) {
						if (item.game) {
							const result = results.find(
								(f) =>
									f.game_time.toString() === item._id.toString() && diff <= 0,
							);

							if (result) continue;

							const start = moment()
								.startOf("day")
								.add(item.start, "minutes")
								.toDate();
							const end = moment()
								.startOf("day")
								.add(item.end, "minutes")
								.toDate();
							const diff = moment(end).diff(moment(), "seconds");
							list.push({
								_id: item._id,
								game: item.game,
								start: start,
								end: end,
								remaining_seconds: diff,
								numbers: [],
								result_id: "",
								auto_result: item.auto_result,
								win_margin: item.win_margin,
							});
						}
					}

					return R("idle game list", list);
				},
				schema.idle_games,
			)
			.get(
				"/live-games",
				async (ctx) => {
					const currentMinutes = moment().diff(
						moment().startOf("day"),
						"minutes",
					);

					const filter: RootFilterQuery<GameTimeClass> = {
						start: { $lte: currentMinutes },
						end: { $gte: currentMinutes },
						result_margin: { $gte: currentMinutes },
						deleted: false,
					};

					const gameTimes = await GameTime.find(filter)
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
							auto_result: 1,
							win_margin: 1,
						})
						.lean();

					const list = [];

					const gameTimeIds: string[] = [];
					const gameIds: string[] = [];

					for (let item of gameTimes) {
						if (!gameTimeIds.includes(item?._id.toString())) {
							gameTimeIds.push(item?._id.toString());
						}

						if (
							item.game?._id &&
							!gameIds.includes(item.game?._id.toString())
						) {
							gameIds.push(item.game._id.toString());
						}
					}

					const numbers = await GameNumber.find({
						game: {
							$in: gameIds,
						},
					})
						.populate([{ path: "number", select: { _id: 1, text: 1 } }])
						.lean();

					const results = await Result.find({
						game_time: {
							$in: gameTimeIds,
						},
					}).lean();

					for (let item of gameTimes) {
						if (item.game) {
							const start = moment()
								.startOf("day")
								.add(item.start, "minutes")
								.toDate();
							const end = moment()
								.startOf("day")
								.add(item.end, "minutes")
								.toDate();
							const diff = moment(end).diff(moment(), "seconds");
							list.push({
								_id: item._id,
								game: item.game,
								start: start,
								end: end,
								remaining_seconds: diff,
								numbers: numbers.filter(
									(f) => f.game.toString() === item.game?._id.toString(),
								),
								result_id:
									results
										.find(
											(f) =>
												f.game_time.toString() === item._id.toString() &&
												diff <= 0,
										)
										?.number.toString() || "",
								auto_result: item.auto_result,
								win_margin: item.win_margin,
							});
						}
					}

					return R("current game list", list);
				},
				schema.live_games,
			)
			.get(
				"/recent-results",
				async ({ query, user }) => {
					const todayStart = moment().startOf("day").toDate();
					const todayEnd = moment().endOf("day").toDate();

					const today = moment();
					const currentTimeMinutes = today.hours() * 60 + today.minutes();

					let filter: RootFilterQuery<ResultClass> = {
						date: { $gte: todayStart, $lte: todayEnd },
						// end: { $lte: currentTimeMinutes },
					};

					const list = await Result.find(filter)
						.populate([
							{
								path: "game_time",
								select: "_id game end",
								populate: {
									path: "game",
									select: "name",
								},
							},
							{
								path: "number",
								select: "text",
							},
						])
						.sort({
							createdAt: -1,
						});

					return R(`${name} list data`, list, true);
				},
				schema.recent_result,
			)
			.get(
				"/upcoming-games",
				async () => {
					const currentMinutes = moment().diff(
						moment().startOf("day"),
						"minutes",
					);

					const filter: RootFilterQuery<GameTimeClass> = {
						start: { $gt: currentMinutes },
						deleted: false,
					};

					const gameTimes = await GameTime.find(filter)
						.populate({
							path: "game",
							select: { _id: 1, name: 1 },
						})
						.select({
							_id: 1,
							game: 1,
							start: 1,
							end: 1,
						})

						.sort({ start: 1 })
						.lean();

					const list: any[] = [];

					for (const item of gameTimes) {
						if (!item.game) continue;

						const startDate = moment()
							.startOf("day")
							.add(item.start, "minutes");

						const endDate = moment().startOf("day").add(item.end, "minutes");

						const remainingSeconds = startDate.diff(moment(), "seconds");

						list.push({
							_id: item._id,
							game: item.game,
							start: startDate.toDate(),
							end: endDate.toDate(),
							remaining_seconds: remainingSeconds > 0 ? remainingSeconds : 0,
							numbers: [],
							result_id: "",
						});
					}

					return R("upcoming game list", list);
				},
				schema.upcoming_games,
			),
);
