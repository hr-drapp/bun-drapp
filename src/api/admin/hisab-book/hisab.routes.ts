import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import Admin from "src/models/drapp/Admin";
import SattaEntry from "src/models/SattaEntry";
import { createElysia } from "src/utils/createElysia";
import moment from "moment";
import SattaNumberEntry from "src/models/SattaNumberEntry";
import Game from "src/models/Game";
import { AnkCategory, dp_pana, pana, sp_pana, tp_pana } from "src/utils/anks";
import SattaResult from "src/models/SattaResult";
import hisabSchema from "./hisab.schema";
import { RoleClass } from "src/models/Role";
import HisabCommision from "src/models/HisabCommision";
import JodiMixHisabCommision from "src/models/JodiMixHisabCommision";
import Result from "src/models/Result";
import NumbersEntry from "src/models/NumbersEntry";
import { connectDatabaseEmulator } from "firebase/database";
import { ModuleId, Summary } from "src/config/modules";

export default createElysia({ prefix: "/hisab" }).guard(
	{
		detail: {
			tags: ["Hisab"],
			summary: Summary([ModuleId.SPINNER_HISAB_COMISSION]),
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app.post(
			"/",
			async ({ body, user }) => {
				console.log("🎯 Hisab Body:", body);
				// 1. find all games where result annnounced
				//  2. find all entries for all those games.
				const role = user.role as RoleClass;
				const today = moment();
				let gameId = (body.game_time || []).filter(
					(id: string) => id !== "all",
				);
				console.log("Game Id", gameId);

				const startDate = body.date_from || today.startOf("day").toDate();
				const endDate = body.date_to || today.endOf("day").toDate();

				const resultGames = await Result.find({
					game_time: { $in: gameId },
					date: { $gte: startDate, $lte: endDate },
				})
					.populate({
						path: "game_time",
						populate: {
							path: "game",
						},
					})
					.populate({
						path: "number",
					});

				console.log("🚀 ~ result annouced Games:", resultGames.length);
				let gameIds = resultGames.map((r) => r.game_time._id.toString());
				console.log("🎯 Games with results:", gameIds.length);
				console.log(
					"Result game_time found:",
					resultGames.map((r) => r.game_time._id.toString()),
				);

				const admin = await Admin.findOne({ _id: body.admin }).select(
					"name email phone",
				);
				console.log("Admin", admin);
				if (!admin) {
					return customError("Admin Not Found");
				}
				// all entries
				//  number entry
				const entries = await NumbersEntry.find({
					game_time: { $in: gameIds },
					date: { $gte: startDate, $lte: endDate },
					...(admin ? { admin: admin._id } : {}),
				})
					.populate({
						path: "game_time",
						populate: {
							path: "game",
						},
					})
					.populate({
						path: "number",
						select: "text",
					});

				// console.log("🎯 Total Entries Found:", entries);

				const now = new Date();
				const todayStart = new Date(now);
				todayStart.setHours(0, 0, 0, 0);
				const tomorrowStart = new Date(todayStart);
				tomorrowStart.setDate(todayStart.getDate() + 1);
				const nowMinutes = now.getHours() * 60 + now.getMinutes();

				const resultsMap = new Map<
					string,
					{
						number: string;
						number_text: string;
						game_time: any;
						skip_until_end: boolean;
					}
				>();

				for (const r of resultGames) {
					if (!r.number) continue;

					resultsMap.set(r.game_time._id.toString(), {
						number: r.number._id.toString(),
						number_text: (r.number as any).text,
						game_time: r.game_time,
						skip_until_end:
							r.date >= todayStart &&
							r.date < tomorrowStart &&
							typeof r.game_time?.end === "number" &&
							r.game_time.end > nowMinutes,
					});
				}

				let commision = await HisabCommision.findOne({
					admin: admin._id,
				}).lean();
				if (!commision) {
					return customError("Commission data not found");
				}

				let total_business = 0;
				let emoji_total = 0;
				const hisabList: any = [];

				for (const entry of entries) {
					const result = resultsMap.get(entry.game_time._id.toString());
					if (!result) continue;
					if (result.skip_until_end) continue;

					const amt = entry.amount || 0;

					total_business += amt;

					let gameRow = hisabList.find(
						(i: any) => i.game_time._id === entry.game_time._id.toString(),
					);

					// 🔹 agar game pehli baar aa raha hai
					if (!gameRow) {
						gameRow = {
							game_time: {
								_id: result.game_time._id.toString(),
								game: {
									name: result.game_time.game.name,
								},
								start: result.game_time.start,
								end: result.game_time.end,
							},
							number: result.number_text,
							emoji_amount: 0,
							game_total: 0,
						};
						hisabList.push(gameRow);
					}

					// 🔹 game ka total business
					gameRow.game_total += amt;

					if (entry.number._id.toString() === result.number) {
						gameRow.emoji_amount = amt;
						emoji_total += amt;
					}
				}

				const total_game_business = hisabList.reduce(
					(sum: number, item: any) => sum + (item.game_total || 0),
					0,
				);
				const grand_total = total_game_business;
				// console.log("number grand", number_grand);
				const sub_total =
					emoji_total * commision.multiplyer +
					(grand_total * commision?.comission) / 100;
				console.log("Hisab List", hisabList);
				console.log(
					"Number Grand:-",
					emoji_total,
					"Grand Total:-",
					grand_total,
					"Sub Total:-",
					sub_total,
					"Game total:-",
					total_game_business,
				);

				return R("Hisab Total", {
					hisabList,
					grand_total,
					sub_total,
					admin,
					emoji_total,
				});
			},
			hisabSchema.list,
		),
);
