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
					const startOfDay = now.clone().startOf("day");
					const currentMinutes = now.diff(startOfDay, "minutes");
					const todayStart = startOfDay.toDate();
					const todayEnd = now.clone().endOf("day").toDate();

					const gameTimes = await GameTime.find({ deleted: false })
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
							result_margin: 1,
						})
						.lean();

					const gameIds: string[] = [];
					const gameTimeIds: string[] = [];

					for (let item of gameTimes) {
						if (item.game?._id) {
							const id = item.game._id.toString();
							if (!gameIds.includes(id)) {
								gameIds.push(id);
							}
						}

						if (!gameTimeIds.includes(item._id.toString())) {
							gameTimeIds.push(item._id.toString());
						}
					}

					const [numbers, results] = await Promise.all([
						gameIds.length
							? GameNumber.find({
									game: { $in: gameIds },
							  })
									.populate([
										{
											path: "number",
											select: { _id: 1, text: 1, texts: 1 },
										},
									])
									.lean()
							: Promise.resolve([]),
						Result.find({
							game_time: { $in: gameTimeIds },
							date: { $gte: todayStart, $lte: todayEnd },
						})
							.populate([
								{
									path: "game_time",
									select: "_id game start end",
									populate: {
										path: "game",
										select: "name",
									},
								},
								{ path: "number", select: "text texts" },
							])
							.sort({ end: -1 })
							.lean(),
					]);

					const numbersByGame = new Map<string, any[]>();
					for (let number of numbers as any[]) {
						const gameId = number.game?.toString();
						if (!gameId) continue;
						if (!numbersByGame.has(gameId)) {
							numbersByGame.set(gameId, []);
						}
						numbersByGame.get(gameId)?.push(number);
					}

					const resultsByGameTime = new Map<string, any>();
					for (let result of results as any[]) {
						const gameTimeId = (result.game_time as any)?._id?.toString();
						if (gameTimeId) {
							resultsByGameTime.set(gameTimeId, result);
						}
					}

					const toDayTime = (minutes: number) =>
						startOfDay.clone().add(minutes, "minutes").toDate();

					const liveGames = [];
					for (let item of gameTimes) {
						if (
							item.game &&
							item.start <= currentMinutes &&
							item.result_margin >= currentMinutes
						) {
							const start = toDayTime(item.start);
							const end = toDayTime(item.end);
							const remaining_seconds = moment(end).diff(moment(), "seconds");
							const gameId = (item.game as any)?._id?.toString();
							liveGames.push({
								_id: item._id,
								game: item.game,
								start,
								end,
								remaining_seconds,
								numbers: numbersByGame.get(gameId) || [],
								result_id:
									remaining_seconds <= 0
										? resultsByGameTime
												.get(item._id.toString())
												?.number?.toString() || ""
										: "",
							});
						}
					}

					const upcomingGames = [];
					for (let item of gameTimes) {
						if (item.game && item.start > currentMinutes) {
							upcomingGames.push({
								_id: item._id,
								game: item.game,
								start: toDayTime(item.start) as any,
								end: toDayTime(item.end) as any,
							});
						}
					}

					const recentResults = [];
					for (let item of results as any[]) {
						if (item.end <= currentMinutes && recentResults.length < 15) {
							const start = toDayTime((item.game_time as any)?.start || 0);
							const end = toDayTime((item.game_time as any)?.end || 0);
							recentResults.push({
								...item,
								game_time: {
									...(item.game_time as any),
									start,
									end,
								},
							});
						}
					}

					const gamesMap = new Map<
						string,
						{
							game: { name: string };
							times: { end: Date; result_text: string }[];
							numbers: any[];
						}
					>();

					const game_with_numbers = [];

					for (let item of gameTimes) {
						if (!item.game?._id) continue;
						const gameId = item.game._id.toString();
						const stored = gamesMap.get(gameId) || {
							game: { name: (item.game as any).name },
							times: [] as any[],
							numbers: [] as any[],
						};
						const result = resultsByGameTime.get(item._id.toString());
						const number = result?.number as any;
						console.log("🚀 ~ item.end:", item.end);
						const remaining_seconds = moment()
							.startOf("day")
							.add(item.end, "minutes")
							.diff(moment(), "seconds");
						console.log("🚀 ~ remaining_seconds:", remaining_seconds);

						const result_text =
							number && remaining_seconds <= 0 ? `${number.text}` : "";

						stored.times.push({
							end: toDayTime(item.end),
							result_text,
						});
						stored.game = { name: (item.game as any).name };
						stored.numbers = numbersByGame.get(gameId) as any[];
						gamesMap.set(gameId, stored);
					}

					const games = [];
					for (let value of gamesMap.values()) {
						const sortedTimes = [...value.times].sort(
							(a, b) => (a.end as any) - (b.end as any),
						);
						const splitIndex = Math.ceil(sortedTimes.length / 2);
						games.push({
							game: value.game,
							game_time_1: sortedTimes.slice(0, splitIndex),
							game_time_2: sortedTimes.slice(splitIndex),
							numbers: value.numbers.map((item) => ({
								text: item.number?.text,
								texts: item.number?.texts,
							})),
						});
					}

					return R(`${name} list data`, {
						liveGames,
						recentResults,
						upcomingGames,
						games,
					});
				},
				schema.home_data,
			)
			.get(
				"/games-results",
				async (ctx) => {
					const now = ctx.query.date ? moment(ctx.query.date) : moment();
					console.log("🚀 ~ now:", now);
					const startOfDay = now.clone().startOf("day");
					const currentMinutes = now.diff(startOfDay, "minutes");
					const todayStart = startOfDay.toDate();
					const todayEnd = now.clone().endOf("day").toDate();

					const gameTimes = await GameTime.find({ deleted: false })
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
							result_margin: 1,
						})
						.lean();

					const gameIds: string[] = [];
					const gameTimeIds: string[] = [];

					for (let item of gameTimes) {
						if (item.game?._id) {
							const id = item.game._id.toString();
							if (!gameIds.includes(id)) {
								gameIds.push(id);
							}
						}

						if (!gameTimeIds.includes(item._id.toString())) {
							gameTimeIds.push(item._id.toString());
						}
					}

					const [numbers, results] = await Promise.all([
						gameIds.length
							? GameNumber.find({
									game: { $in: gameIds },
							  })
									.populate([
										{
											path: "number",
											select: { _id: 1, text: 1, texts: 1 },
										},
									])
									.lean()
							: Promise.resolve([]),
						Result.find({
							game_time: { $in: gameTimeIds },
							date: { $gte: todayStart, $lte: todayEnd },
						})
							.populate([
								{
									path: "game_time",
									select: "_id game start end",
									populate: {
										path: "game",
										select: "name",
									},
								},
								{ path: "number", select: "text texts" },
							])
							.sort({ end: -1 })
							.lean(),
					]);

					const numbersByGame = new Map<string, any[]>();
					for (let number of numbers as any[]) {
						const gameId = number.game?.toString();
						if (!gameId) continue;
						if (!numbersByGame.has(gameId)) {
							numbersByGame.set(gameId, []);
						}
						numbersByGame.get(gameId)?.push(number);
					}

					const resultsByGameTime = new Map<string, any>();
					for (let result of results as any[]) {
						const gameTimeId = (result.game_time as any)?._id?.toString();
						if (gameTimeId) {
							resultsByGameTime.set(gameTimeId, result);
						}
					}

					const toDayTime = (minutes: number) =>
						startOfDay.clone().add(minutes, "minutes").toDate();

					const gamesMap = new Map<
						string,
						{
							game: { name: string };
							times: { end: Date; result_text: string }[];
							numbers: any[];
						}
					>();

					for (let item of gameTimes) {
						if (!item.game?._id) continue;
						const gameId = item.game._id.toString();
						const stored = gamesMap.get(gameId) || {
							game: { name: (item.game as any).name },
							times: [] as any[],
							numbers: [] as any[],
						};
						const result = resultsByGameTime.get(item._id.toString());
						const number = result?.number as any;
						console.log("🚀 ~ item.end:", item.end);
						const remaining_seconds = moment()
							.startOf("day")
							.add(item.end, "minutes")
							.diff(moment(), "seconds");
						console.log("🚀 ~ remaining_seconds:", remaining_seconds);

						const result_text =
							(number && remaining_seconds <= 0) ||
							(number &&
								!moment().isBetween(moment(todayStart), moment(todayEnd)))
								? `${number.text}`
								: "";

						stored.times.push({
							end: toDayTime(item.end),
							result_text,
						});
						stored.game = { name: (item.game as any).name };
						stored.numbers = numbersByGame.get(gameId) as any[];
						gamesMap.set(gameId, stored);
					}

					const games = [];
					for (let value of gamesMap.values()) {
						const sortedTimes = [...value.times].sort(
							(a, b) => (a.end as any) - (b.end as any),
						);
						const splitIndex = Math.ceil(sortedTimes.length / 2);
						games.push({
							game: value.game,
							game_time_1: sortedTimes.slice(0, splitIndex),
							game_time_2: sortedTimes.slice(splitIndex),
							numbers: value.numbers.map((item) => ({
								text: item.number?.text,
								texts: item.number?.texts,
							})),
						});
					}

					return R(`${name} list data`, {
						games,
					});
				},
				schema.games_results,
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

					const todayStart = moment().startOf("day").toDate();
					const todayEnd = moment().endOf("day").toDate();

					const results = await Result.find({
						game_time: {
							$in: gameTimeIds,
						},
						date: { $gte: todayStart, $lte: todayEnd },
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
						end: { $lte: currentTimeMinutes },
					};

					const list = await Result.find(filter)
						.populate([
							{
								path: "game_time",
								select: "_id game start end",
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
						.limit(5)
						.sort({ end: -1 });

					for (let item of list) {
						const start = moment()
							.startOf("day")
							.add((item.game_time as any)?.start, "minutes");
						const end = moment()
							.startOf("day")
							.add((item.game_time as any)?.end, "minutes");

						(item.game_time as any).start = start;
						(item.game_time as any).end = end;
					}

					return R(`${name} list data`, list, true);
				},
				schema.recent_result,
			)
			.get(
				"/upcoming-games",
				async ({ query, user }) => {
					const currentMinutes = moment().diff(
						moment().startOf("day"),
						"minutes",
					);

					const filter: RootFilterQuery<GameTimeClass> = {
						start: { $gt: currentMinutes },
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
						})
						.lean();

					for (let item of gameTimes) {
						const start = moment()
							.startOf("day")
							.add(item?.start, "minutes")
							.toDate();
						const end = moment()
							.startOf("day")
							.add(item?.end, "minutes")
							.toDate();
						console.log("🚀 ~ start:", start);

						item.start = start as any;
						item.end = end as any;
					}

					return R(`${name} list data`, gameTimes, true);
				},
				schema.upcoming_games,
			),
);
