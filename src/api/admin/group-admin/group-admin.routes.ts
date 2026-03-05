import { isAdminAuthenticated } from "src/guard/auth.guard";
import { R } from "src/utils/response-helpers";
import gamesSchema from "./group-admin.schema";
import GroupAdmin, { GroupAdminClass } from "src/models/GroupAdmin";
import { createElysia } from "src/utils/createElysia";
import { RootFilterQuery, Types } from "mongoose";
import { ModuleId, Summary } from "src/config/modules";
import GameCategory from "src/models/GameCategory";
import Group from "src/models/Group";
import Admin from "src/models/drapp/Admin";
import Persikop from "src/utils/Periskop";
const periskope = new Persikop();

export default createElysia({ prefix: "/group-admin" }).guard(
	{
		detail: {
			tags: ["GroupAdmin"],
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

					const filter: RootFilterQuery<GroupAdminClass> = {};

					const list = await GroupAdmin.find(filter)
						.skip(page * size)
						.limit(size)
						.lean();

					const total = await GroupAdmin.countDocuments(filter);

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
					const entry = await GroupAdmin.create(body);

					/**  */
					CountTotalAdmins(entry!.group!);
					AddParticipant(entry!.group!, body.admin);
					/**  */

					return R("entry updated", entry);
				},
				gamesSchema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const entry = await GroupAdmin.findByIdAndUpdate(query.id, body!, {
						new: true,
					});

					/**  */
					CountTotalAdmins(entry!.group!);
					/**  */

					return R("entry updated", entry);
				},
				gamesSchema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await GroupAdmin.findByIdAndDelete(query.id);

					/**  */
					CountTotalAdmins(entry!.group!);
					RemoveParticipant(entry?.group!, entry?.admin);
					/**  */

					return R("entry updated", entry);
				},
				gamesSchema.delete,
			),
);

async function CountTotalAdmins(groupId: string | Types.ObjectId | any) {
	/**  */
	const count = await GroupAdmin.countDocuments({
		group: groupId,
	});

	await Group.findByIdAndUpdate(groupId, {
		admin_count: count,
	});
	/**  */
}

async function AddParticipant(
	groupId: string | Types.ObjectId | any,
	adminId: string | Types.ObjectId | any,
) {
	/**  */
	const group = await Group.findById(groupId);

	if (!group) return;

	const admin = await Admin.findById(adminId);

	if (!admin) return;

	const phone = "91" + admin.phone;

	periskope.addParticipantsToGroup({
		groupChatId: group.groupId,
		participants: [phone],
	});

	/**  */
}

async function RemoveParticipant(
	groupId: string | Types.ObjectId | any,
	adminId: string | Types.ObjectId | any,
) {
	/**  */
	const group = await Group.findById(groupId);
	console.log("🚀 ~ RemoveParticipant ~ group:", group);

	if (!group) return;

	const admin = await Admin.findById(adminId);

	if (!admin) return;

	const phone = "91" + admin.phone;

	periskope.removeParticipantsToGroup({
		groupChatId: group.groupId,
		participants: [phone],
	});

	/**  */
}
