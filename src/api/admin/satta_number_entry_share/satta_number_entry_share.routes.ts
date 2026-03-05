import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import rolesSchema from "./satta_number_entry_share.schema";
import Admin from "src/models/drapp/Admin";
import { createElysia } from "src/utils/createElysia";
import moment from "moment";
import { AnkCategory, anks } from "src/utils/anks";
import SattaNumberEntryShare from "src/models/SattaNumberEntryShare";

export default createElysia({ prefix: "/satta_number_entry_share" }).guard(
	{
		detail: {
			tags: ["Satta Number Entry Share"],
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.get(
				"/",
				async ({ query, user }) => {
					const category = query.category as AnkCategory;
					const game = query.game;
					const today = moment().startOf("day");

					const detail = await SattaNumberEntryShare.find({
						category: category,
						game: game,
						date: today,
					});

					return R("entry numbers list data", detail, true, {});
				},
				rolesSchema.list,
			)

			.post(
				"/",
				async ({ body, user }: any) => {
					const today = moment().startOf("day");
					console.log("🚀 ~~ Body", body);

					const entries = await SattaNumberEntryShare.find({
						game: body.game,
						category: body.category,
						date: today,
					});
					console.log("Share", entries);
					console.log("User role Name", user.role.name);
					if (entries.length && user.role.name == "MASTER") {
						for (let entry of entries) {
							entry.master_share = body.share;
							entry.master_share_type = body.type;
							entry.master = user._id;
							await entry.save();
						}
						return R("entry updated", entries);
					} else {
						let entry = await SattaNumberEntryShare.findOne({
							game: body.game,
							category: body.category,
							date: today,
							admin: user._id.toString(),
						});

						const payload = {};
						console.log("🚀 User Role:", user.role);
						if (!entry) {
							entry = await SattaNumberEntryShare.create({
								game: body.game,
								category: body.category,
								date: today,
								admin: user._id.toString(),
							});
						}

						if (user.role.name == "SUPER ADMIN") {
							entry.super_admin_share = body.share;
							entry.super_admin_share_type = body.type;
							entry.super_admin = user._id;
						} else if (user.role.name == "MASTER") {
							entry.master_share = body.share;
							entry.master_share_type = body.type;
							entry.master = user._id;
						} else if (user.role.name == "TEAM MEMBER") {
							entry.team_member_share = body.share;
							entry.team_member_share_type = body.type;
							entry.team_member = user._id;
						}

						await entry.save();
						console.log("🚀 Share", entry);
						return R("entry updated", entry);
					}
				},
				rolesSchema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					// const entry = await SattaNumberEntry.findByIdAndUpdate(query.id, body);

					return R("entry updated");
				},
				rolesSchema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await SattaNumberEntryShare.findByIdAndDelete(query.id);

					return R("entry updated", entry);
				},
				rolesSchema.delete,
			),
);
