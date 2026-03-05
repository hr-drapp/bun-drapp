import { isAdminAuthenticated } from "src/guard/auth.guard";
import { customError } from "src/utils/AppErr";
import { R } from "src/utils/response-helpers";
import { createElysia } from "src/utils/createElysia";
import moment from "moment";
import SattaResult from "src/models/SattaResult";
import resultSchema from "./notice.schema";
import Game from "src/models/Game";
import Admin from "src/models/drapp/Admin";
import Group from "src/models/Group";
import MessageQueue from "src/models/MessageQueue";
import Notice from "src/models/Notice";
import GameTime from "src/models/GameTime";
import GroupGameTime from "src/models/GroupGameTime";

export default createElysia({ prefix: "/notice" }).guard(
	{
		detail: {
			tags: ["Notice"],
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.post(
				"/notice-add",
				async (ctx) => {
					console.log("Calling /notice-add.......");
					const { game_time, text } = ctx.body;

					console.log("Add Body", ctx.body);

					const noticeGame = await GameTime.findById(game_time);
					console.log("Notice Game ", noticeGame);

					const groupGameTime = await GroupGameTime.find({
						game_time: noticeGame?._id,
					});

					const groups = await Group.find({
						groupId: { $in: groupGameTime.map((g) => g.group) },
					}).populate("gameId", "_id");

					if (!noticeGame) {
						return customError("Game Not Found");
					}

					const newNotice = await Notice.create({
						game: noticeGame._id,
						text: text,
					});

					for (let group of groups) {
						await MessageQueue.create({
							group: group.groupId,
							text: text || "NA",
						});
					}

					return R("Notice Sent successfully", newNotice);
				},
				resultSchema.notice_add,
			)
			.get(
				"/notice-list",
				async (ctx) => {
					const page = parseInt(ctx.query.page || "0");
					const size = parseInt(ctx.query.size || "10");

					const admin = await Admin.findById(ctx.user?._id);
					console.log("Admin", admin);

					// 🔍 Admin filter logic
					let filter: any = {};

					// agar super admin nahi hai, to sirf uske games dikhana
					if (!admin?.super_admin) {
						filter["game"] = { $in: admin?.games };
					}

					console.log("Filter Query:", filter);

					// 🧠 Directly find from SattaResult
					const existingNotice = await Notice.find(filter)
						.populate({
							path: "game_time",
						})
						.skip(page * size)
						.limit(size)
						.sort({ date: -1 });

					// console.log("Exiting Notice", existingNotice);
					// total count (pagination ke liye)
					const total = await Notice.countDocuments(filter);
					const pages = Math.ceil(total / size);

					return R("Notice list", existingNotice, true, {
						pages,
						total,
						page,
						size,
					});
				},
				resultSchema.notice_list,
			),
);
