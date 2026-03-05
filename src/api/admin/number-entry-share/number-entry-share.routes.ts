import { isAdminAuthenticated } from "src/guard/auth.guard";
import { createElysia } from "src/utils/createElysia";
import NumberEntryShare from "src/models/NumberEntryShare";
import { R } from "src/utils/response-helpers";
import { customError } from "src/utils/AppErr";
import moment from "moment";
import { AnkCategory } from "src/utils/anks";
import GameTime from "src/models/GameTime";
import schema from "./number_entry_share.schema";
import { RoleLevel } from "src/models/Role";
import { ModuleId, Summary } from "src/config/modules";
export default createElysia({ prefix: "/number-entry-share" }).guard(
	{
		detail: {
			tags: ["Number Entry Share"],
			summary: Summary([ModuleId.CHART]),
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.get(
				"/",
				async ({ query, user }) => {
					const category = query.category;
					const game = query.game;
					const game_time = query.game_time;
					const today = moment().startOf("day");

					const gameTime = await GameTime.findOne({
						game: game,
						_id: game_time,
					});

					const entry = await NumberEntryShare?.find({
						category: category,
						game: game,
						game_time: gameTime?._id,
						date: today,
					});
					return R("entry Share List", entry, true, {});
				},
				schema.list,
			)
			.post(
				"/",
				async ({ body, user }) => {
					const today = moment().startOf("day");
					const adminLevel = (user.role as any).level;
					console.log("🚀 User Role Level", adminLevel);
					console.log("🚀 User Role ", (user.role as any).name);

					const game_time = await GameTime.findById(body?.game_time);

					const entries = await NumberEntryShare.find({
						category: body.category,
						game: body.game,
						game_time: game_time?._id,
					});

					if (entries?.length && adminLevel == RoleLevel?.L2) {
						for (let entry of entries) {
							entry.master_share = body.share;
							entry.master_share_type = body.type as "percentage" | "cutting";
							entry.master = user?._id.toString();
							await entry.save();
						}
						return R("entry Updated", entries);
					} else {
						let entry = await NumberEntryShare.findOne({
							game: body.game,
							game_time: game_time?._id,
							category: body.category,
							date: today,
							admin: user?._id,
						});

						if (!entry) {
							entry = await NumberEntryShare.create({
								game: body.game,
								game_time: game_time?._id,
								admin: user._id,
								date: today,
							});
						}

						if (adminLevel == RoleLevel?.L1) {
							entry.super_admin_share = body.share;
							entry.super_admin_share_type = body.type as
								| "percentage"
								| "cutting";
							entry.super_admin = user?._id.toString();
						} else if (adminLevel == RoleLevel.L2) {
							entry.master_share = body.share;
							entry.master_share_type = body.type as "percentage" | "cutting";
							entry.master = user?._id.toString();
						} else if (adminLevel == RoleLevel.L3) {
							entry.team_member_share = body.share;
							entry.team_member_share_type = body.type as
								| "percentage"
								| "cutting";
							entry.team_member = user?._id.toString();
						}

						await entry.save();
						console.log("🚀 Share", entry);
						return R("entry updated", entry);
					}
				},
				schema.create,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await NumberEntryShare.findByIdAndDelete(query.id);

					return R("entry updated", entry);
				},
				schema.delete,
			),
);
