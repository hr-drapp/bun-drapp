import { createElysia } from "src/utils/createElysia";
import { R } from "src/utils/response-helpers";
import { customError } from "src/utils/AppErr";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import Message from "src/models/Message";
import messageSchema from "./message.schema";
import Admin from "src/models/drapp/Admin";
import Role from "src/models/Role";

export default createElysia({ prefix: "/message" }).guard(
	{
		detail: {
			tags: ["Message"],
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app.get(
			"/",
			async (ctx) => {
				const page = parseInt(ctx.query.page || "");
				const size = parseInt(ctx.query.size || "");
				const query: any = { status: "pending" };
				const admin = await Admin.findById(ctx.user._id).populate("role");

				console.log("Admin", admin);

				// const role = await Role.find();
				// console.log("Role", role);
				if (!admin) {
					return customError("User Not Found");
				}

				if (!(admin.role as any)?.super_admin) {
					if ((admin?.role as any)?.name == "MASTER") {
						const teamMembers = await Admin.find({
							parent: admin?._id,
						}).select("_id");
						console.log("Team members", teamMembers);
						let teamMembersIds = teamMembers.map((m) => m._id);

						query.user = { $in: teamMembersIds };
					}
				}

				const list = await Message.find(query)
					.populate({
						path: "user",
						select: "_id name",
					})
					.populate({
						path: "group",
						select: "_id name adminId groupId",
					})
					.skip(page * size)
					.limit(size);

				console.log("Message List", list);

				const total = await Message.countDocuments(query);
				const pages = Math.ceil(total / size);
				return R("message list", list, true, {
					total,
					pages,
					page,
					size,
				});
			},
			messageSchema.list,
		),
);
