import { isAdminAuthenticated } from "src/guard/auth.guard";
import { R } from "src/utils/response-helpers";
import gamesSchema from "./group-game-time.schema";
import GroupGameTime, { GroupGameTimeClass } from "src/models/GroupGameTime";
import { createElysia } from "src/utils/createElysia";
import { RootFilterQuery, Types } from "mongoose";
import { ModuleId, Summary } from "src/config/modules";
import GameCategory from "src/models/GameCategory";
import Group from "src/models/Group";

export default createElysia({ prefix: "/group-game-time" }).guard(
	{
		detail: {
			tags: ["GroupGameTime"],
			summary: Summary([ModuleId.GROUP]),
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

					const filter: RootFilterQuery<GroupGameTimeClass> = {};

					const list = await GroupGameTime.find(filter)
						.skip(page * size)
						.limit(size)
						.lean();

					const total = await GroupGameTime.countDocuments(filter);

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
					const entry = await GroupGameTime.create(body);

					/**  */
					CountTotalGameTimes(entry!.group!);
					/**  */

					return R("entry updated", entry);
				},
				gamesSchema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					console.log("🚀~~ Body:", body);

					const entry = await GroupGameTime.findByIdAndUpdate(query.id, body!, {
						new: true,
					});

					/**  */
					CountTotalGameTimes(entry!.group!);
					/**  */

					return R("entry updated", entry);
				},
				gamesSchema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					console.log("🚀 ~ query.id:", query.id);
					const entry = await GroupGameTime.findByIdAndDelete(query.id);
					console.log("🚀 ~ entry:", entry);

					/**  */
					CountTotalGameTimes(entry!.group!);
					/**  */

					return R("entry updated", entry);
				},
				gamesSchema.delete,
			),
);

async function CountTotalGameTimes(groupId: string | Types.ObjectId | any) {
	/**  */
	const gameCount = await GroupGameTime.countDocuments({
		group: groupId,
	});

	await Group.findByIdAndUpdate(groupId, {
		game_time_count: gameCount,
	});
	/**  */
}
