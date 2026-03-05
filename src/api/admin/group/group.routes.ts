import { createElysia } from "src/utils/createElysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import Group, { GroupTypeEnum } from "src/models/Group";
import wassenger from "src/utils/Was";
import groupSchema from "./group.schema";
import { R } from "src/utils/response-helpers";
import { customError } from "src/utils/AppErr";
import Admin from "src/models/drapp/Admin";
import { query } from "firebase/database";
import User, { UserClass } from "src/models/User";
import { group } from "console";
import { isNumber } from "src/utils/numbers";
import Whapi from "src/utils/Whapi";
import Periskop from "src/utils/Periskop";
import { ModuleId, Summary } from "src/config/modules";

const Wha = new Whapi();
const Peris = new Periskop();

export default createElysia({ prefix: "/group" }).guard(
	{
		detail: {
			tags: ["Group"],
			summary: Summary([ModuleId.GROUP]),
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.post(
				"/",
				async ({ body, user }) => {
					const group = await Group.findOne({ name: body.name });
					let source;

					if (group) {
						return customError("Group Already Created ");
					}

					if (body.type == GroupTypeEnum.JODI_MIX) {
						source = 1;
					} else if (body.type == GroupTypeEnum.MIX) {
						source = 2;
					} else if (body.type == GroupTypeEnum.SPINNER) {
						source = 3;
					}

					const groupMembers = ["917069305177"];

					if (isNumber(user.phone)) {
						groupMembers.push("91" + user.phone);
					}
					console.log("🚀 ~ groupMembers:", groupMembers);

					const groupEntry = new Group({
						name: body.name,
						type: source,
						admin: user._id,
						beat_type: body.beat_type,
					});

					// const response = await Wha.createGroup({
					//   name: body.name || "",
					//   description: groupEntry._id.toString() || "",
					//   participants: groupMembers || "",
					// });

					const response = await Peris.creategroup({
						name: body.name,
						description: "",
						participants: groupMembers || "",
					});
					if (!response?.chat_id) {
						return customError(
							"can't create group at the time, please try again.",
						);
					}
					groupEntry.groupId = response?.chat_id as any;
					await groupEntry.save();

					return R("Group Created Successflly");
				},
				groupSchema.create,
			)
			.get(
				"/",
				async (ctx) => {
					const page = parseInt(ctx.query.page);
					const size = parseInt(ctx.query.size);
					let query = {};

					const admin = await Admin.findOne({ _id: ctx.user._id }).populate(
						"role",
					);

					if (!(admin?.role as any).super_admin) {
						query = { admin: ctx.user._id };
					}
					// console.log("Admin", admin);

					const groups = await Group.find(query)
						.skip(page * size)
						.limit(size)
						.sort({ createdAt: -1 });

					const total = await Group.countDocuments(query);
					const pages = Math.ceil(total / size);

					return R("group data list", groups, true, {
						pages: pages,
						total: total,
						page: page,
						size: size,
					});
				},
				groupSchema.list,
			)
			.get(
				"/detail",
				async (ctx) => {
					const detail = await Group.findById(ctx.query.id);

					if (!detail) return customError("invalid Group");

					return R("group detail", detail);
				},
				groupSchema.detail,
			)
			.delete(
				"/",
				async ({ query }) => {
					const id = query.id;

					const groupEntry = await Group.findByIdAndDelete(id);

					return R("group deleted ", groupEntry);
				},
				groupSchema.delete,
			)
			.put(
				"/",
				async (ctx) => {
					// console.log("Body", ctx.body);
					let type = ctx.body.type;
					const group = await Group.findByIdAndUpdate(ctx.query.id, {
						...ctx.body,
						type: type,
					});
					Peris.updateGroupName({
						groupChatId: group?.groupId!,
						name: ctx.body.name!,
					});
					// console.log("Group", group);
					return R("group updated");
				},
				groupSchema.update,
			),
);
