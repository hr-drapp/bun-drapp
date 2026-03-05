import { R } from "src/utils/response-helpers";
import schema, { name } from "./spinner-result-schema";
import GameCategory, { GameCategoryClass } from "src/models/GameCategory";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import { RootFilterQuery } from "mongoose";
import { buildScopedQuery } from "src/utils/access-grants";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { ModuleId, Summary } from "src/config/modules";
import HisabCommision, { HisabComissonClass } from "src/models/HisabCommision";
import { RoleLevel } from "src/models/Role";
import Admin from "src/models/drapp/Admin";
import moment from "moment";
import GameTime from "src/models/GameTime";
import GroupGameTime from "src/models/GroupGameTime";
import Group from "src/models/Group";
import Result from "src/models/Result";
import GameNumber from "src/models/GameNumber";
import MessageQueue from "src/models/MessageQueue";
import Numbers from "src/models/Numbers";
import agenda from "src/cron/cron";

await agenda.start();

export default createElysia({ prefix: "/spinner-result" }).guard(
	{
		detail: {
			tags: ["SpinnerResult"],
			summary: Summary([ModuleId.SPINNER_RESULT]),
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
					const queryDate = query.fillter ? moment(query.fillter) : moment();

					const todayStart = queryDate.startOf("day").toDate();
					const todayEnd = queryDate.endOf("day").toDate();

					let filter: any = {
						date: { $gte: todayStart, $lte: todayEnd },
					};

					const [list, total] = await Promise.all([
						Result.find(filter)
							.populate({
								path: "game_time",
								populate: {
									path: "game",
									select: "name",
								},
							})
							.populate({
								path: "number",
								select: "text",
							})
							.sort({ createdAt: -1 })
							.skip(page * size)
							.limit(size),

						Result.countDocuments(filter),
					]);

					const pages = Math.ceil(total / size);
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
					const providedDate = body?.date ? moment(body.date) : null;
					const currentMoment = moment();
					const effectiveDate =
						providedDate?.isValid() &&
						providedDate.isBefore(currentMoment, "day")
							? providedDate
							: currentMoment;

					const todayStart = effectiveDate.clone().startOf("day").toDate();
					const todayEnd = effectiveDate.clone().endOf("day").toDate();

					const resultGameTime = await GameTime.findById(
						body.game_time,
					).populate("game", "_id name");

					if (!resultGameTime) {
						return customError("Invalid Selected Game");
					}

					const gameEndTime = moment()
						.startOf("day")
						.add(resultGameTime.end, "minutes");

					const existingResult = await Result.findOne({
						game_time: resultGameTime._id,
						date: { $gte: todayStart, $lte: todayEnd },
					});

					if (existingResult) {
						await existingResult.deleteOne({});
					}

					const resultNumber = await Numbers.findById(body.number);
					if (!resultNumber) {
						return customError("Invalid Number");
					}

					const entry = await Result.create({
						number: body.number,
						game_time: resultGameTime._id,
						date: effectiveDate,
						end: resultGameTime.end,
					});

					if (
						gameEndTime.isAfter(currentMoment.clone()) ||
						providedDate?.isValid()
					) {
						await agenda.schedule(
							gameEndTime.add(20, "seconds").toDate(),
							"send-result-message",
							{
								result_id: entry._id.toString(),
							},
						);
					} else {
						await agenda.now("send-result-message", {
							result_id: entry._id.toString(),
						});
					}

					return R("entry updated", entry);
				},
				schema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const entry = await Result.findByIdAndUpdate(query.id, body as any);

					return R("entry updated", entry);
				},
				schema.update,
			)
			.get(
				"/detail",
				async ({ body, query }) => {
					const entry = await HisabCommision.findById(query.id);

					if (!entry) return customError("Invalid Game Category");

					return R("entry updated", entry);
				},
				schema.detail,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await Result.findByIdAndDelete(query.id);

					return R("entry deleted", entry);
				},
				schema.delete,
			),
);
