import { isAdminAuthenticated } from "src/guard/auth.guard";
import { R } from "src/utils/response-helpers";
import rolesSchema from "./spinner-dashboard.schema";
import Admin, { AdminClass } from "src/models/drapp/Admin";
import { createElysia } from "src/utils/createElysia";
import moment from "moment";
import SattaEntry from "src/models/SattaEntry";
import Role, { RoleClass, RoleLevel } from "src/models/Role";
import SattaNumberEntry from "src/models/SattaNumberEntry";
import SattaNumberEntryShare from "src/models/SattaNumberEntryShare";
import { AnkCategory, anks } from "src/utils/anks";
import NumbersEntry from "src/models/NumbersEntry";
import NumberEntryShare from "src/models/NumberEntryShare";
import { ModuleId, Summary } from "src/config/modules";

export default createElysia({ prefix: "/spinner-dashboard" }).guard(
	{
		detail: {
			tags: ["Spinnar Dashboard"],
			summary: Summary([ModuleId.DASHBOARD]),
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.get(
				"/insights",
				async ({ user }) => {
					const today = moment();

					const startDate = today.startOf("day").toDate();
					const endDate = today.endOf("day").toDate();

					const MASTER = RoleLevel.L2;
					const TEAM_MEMBER = RoleLevel.L3;

					const filter = {} as Record<any, any>;
					if (!user.super_admin) {
						filter.parent = user._id;
					}

					const roles = await Role.find({
						level: {
							$in: [MASTER, TEAM_MEMBER],
						},
					}).select("_id name level");
					console.log("Role", roles);

					const masterRole = roles.find((f) => f.level === MASTER);
					const teamMemberRole = roles.find((f) => f.level === TEAM_MEMBER);

					const masterIdsEntity = await Admin.find({
						role: masterRole?._id,
						...filter,
					})
						.select("_id")
						.lean();
					console.log("");
					const masterIds = masterIdsEntity.map((m) => m._id);
					console.log("🚀 ~ masterIds:", masterIds);

					const teamMemberIdsEntity = await Admin.find({
						role: teamMemberRole?._id,
						...filter,
					})
						.select("_id")
						.lean();

					const teamMemberIds = teamMemberIdsEntity.map((m) => m._id);
					console.log("🚀 ~ teamMemberIds:", teamMemberIds);

					const todays_total_amount = await NumbersEntry.aggregate([
						{
							$match: {
								date: {
									$gte: startDate,
									$lt: endDate,
								},
							},
						},
						{
							$group: {
								_id: null,
								total_amount: {
									$sum: "$total_amount",
								},
							},
						},
					]).exec();

					const total_master_count = masterIds.length;

					const total_team_members_count = teamMemberIds.length;

					const total_master_contribution = await NumbersEntry.aggregate([
						{
							$match: {
								admin: {
									$in: masterIds,
								},
								date: {
									$gte: startDate,
									$lt: endDate,
								},
							},
						},
						{
							$group: {
								_id: null,
								total_amount: {
									$sum: "$total_amount",
								},
							},
						},
					]).exec();

					const total_team_member_contribution = await NumbersEntry.aggregate([
						{
							$match: {
								admin: {
									$in: teamMemberIds,
								},
								date: {
									$gte: startDate,
									$lt: endDate,
								},
							},
						},
						{
							$group: {
								_id: null,
								total_amount: {
									$sum: "$total_amount",
								},
							},
						},
					]).exec();

					return R("Dashboard Analytics", {
						todays_total_amount: todays_total_amount?.[0]?.total_amount || 0,
						total_master_count: total_master_count,
						total_team_members_count: total_team_members_count,
						total_master_contribution:
							total_master_contribution?.[0]?.total_amount || 0,
						total_team_member_contribution:
							total_team_member_contribution?.[0]?.total_amount || 0,
					});
				},
				rolesSchema.insights,
			)
			.post(
				"/grand-total",
				async ({ body, user }) => {
					console.log("🚀 ~ Body", body);
					const role = user.role as RoleClass;
					const today = moment();
					const admin_Type = body.admin_type;

					const startDate = body.date_from || today.startOf("day").toDate();
					console.log("🚀~~ Starting Date", startDate);
					const endDate = body.date_to || today.endOf("day").toDate();
					console.log("🚀~~ End Date ", endDate);

					const dateRange = `${moment(startDate).format(
						"DD-MM-YYYY HH:mm",
					)} - ${moment(endDate).format("DD-MM-YYYY HH:mm")}`;

					let adminIds = body.admin_ids || [];

					const gameTimeIds = body.game_time_ids || [];

					if (role?.level === RoleLevel.L3) {
						adminIds = [user._id.toString()];
					}

					const filter = {} as Record<any, any>;
					if (admin_Type === "customer") {
						filter.is_customer = true;
					} else if (admin_Type === "normal") {
						filter.is_customer = false;
					}

					if (!user.super_admin) {
						filter.parent = user._id;
					}

					if (adminIds.length || adminIds.includes("all")) {
						// adminIds = adminIds.map(item => new Schema.Types.ObjectId(item)) as any;
						if (adminIds.includes("all") && user.super_admin) {
							const admins = await Admin.find({
								...filter,
							})
								.sort({ role: -1 })
								.select("_id name phone role")
								.lean();
							console.log("🚀.post ~ admins:", admins);
							adminIds = admins.map((item) => item._id.toString());
							console.log("🚀 ~ ).post ~ adminIds:", adminIds);
						} else {
							adminIds = adminIds.filter((id: any) => id !== "all");
							if (user.super_admin) {
								const admins = await Admin.find({
									$or: [
										{
											_id: {
												$in: adminIds,
											},
										},
										{
											parent: {
												$in: adminIds,
											},
										},
									],
									...filter,
								})
									.sort({ role: -1 })
									.select("_id name phone role")
									.lean();
								console.log("🚀 ~ ).post ~ admins:", admins);

								adminIds = admins.map((item) => item._id.toString());
								console.log("🚀 ~ ).post ~ adminIds:", adminIds);
							}
						}
					}

					console.log({
						adminIds,
						startDate,
						endDate,
					});

					const numberEntries = await NumbersEntry.find({
						date: {
							$gte: startDate,
							$lt: endDate,
						},
						...(adminIds.length
							? {
									admin: { $in: adminIds },
							  }
							: !user.super_admin
							? { parent: user._id }
							: {}),
						...(gameTimeIds.length
							? {
									game_time: {
										$in: gameTimeIds,
									},
							  }
							: {}),
					})
						.populate("number", "_id text")
						.sort({ admin: -1 });
					console.log("Number Entries:", numberEntries);
					// adminIds = [...new Set(sattaNumberEntries.map(item => item.admin.toString()))];

					const admins = await Admin.find({
						_id: {
							$in: adminIds,
						},
						...filter,
					})
						.sort({ role: -1 })
						.select("_id name phone role")
						.lean();
					const adminMap = new Map();

					const roleIds = [];

					for (let a of admins) {
						adminMap.set(a._id.toString(), a);

						roleIds.push(a.role.toString());
					}

					const roles = await Role.find({
						_id: {
							$in: roleIds,
						},
					}).select("_id name level");

					const roleMap = new Map();

					for (let r of roles) {
						roleMap.set(r._id.toString(), r);
					}
					let grandTotal = 0;

					const adminsResultMap = new Map();
					const numberResultMap = new Map();
					// const result = [] as { admins: { _id: string, totalAmount: number, admin: AdminClass }[], numbers: { number: number, amount: number }[] }[]
					console.log("ADMIN ID: ", adminIds);
					const share = await NumberEntryShare.find({
						date: {
							$gte: startDate,
							$lt: endDate,
						},
						...(adminIds.length
							? {
									admin: { $in: adminIds },
							  }
							: !user.super_admin
							? { parent: user._id }
							: {}),
						...(gameTimeIds.length
							? {
									game_time: {
										$in: gameTimeIds,
									},
							  }
							: {}),
					}).lean();
					console.log("🚀 ~ ).post ~ share:", share);

					for (let r of numberEntries as any) {
						r.actual_amount = r.amount;
						let adjustedAmount = r.amount;

						const rAdmin = adminMap.get(r.admin.toString());

						const findShare = share.find(
							(f) =>
								f.game_time.toString() === r.game_time.toString() &&
								(f.admin.toString() === r.admin.toString() ||
									f.admin.toString() === rAdmin?.parent?.toString()),
						);

						const rAdminRole = roleMap.get(rAdmin?.role?._id?.toString() || "");

						if (findShare) {
							// SUPER ADMIN ke liye share
							if (rAdminRole?.level === RoleLevel.L1) {
								if (findShare.super_admin_share_type === "percentage")
									adjustedAmount =
										(adjustedAmount / 100) *
										(100 - findShare.super_admin_share);
								else if (findShare.super_admin_share_type === "cutting")
									adjustedAmount -= findShare.super_admin_share;

								if (findShare.master_share_type === "percentage")
									adjustedAmount =
										(adjustedAmount / 100) * (100 - findShare.master_share);
								else if (findShare.master_share_type === "cutting")
									adjustedAmount -= findShare.master_share;

								if (findShare.team_member_share_type === "percentage")
									adjustedAmount =
										(adjustedAmount / 100) *
										(100 - findShare.team_member_share);
								else if (findShare.team_member_share_type === "cutting")
									adjustedAmount -= findShare.team_member_share;
							}
							// MASTER ke liye share
							else if (rAdminRole?.level === RoleLevel.L2) {
								if (findShare.master_share_type === "percentage")
									adjustedAmount =
										(adjustedAmount / 100) * (100 - findShare.master_share);
								else if (findShare.master_share_type === "cutting")
									adjustedAmount -= findShare.master_share;

								if (findShare.team_member_share_type === "percentage")
									adjustedAmount =
										(adjustedAmount / 100) *
										(100 - findShare.team_member_share);
								else if (findShare.team_member_share_type === "cutting")
									adjustedAmount -= findShare.team_member_share;
							}
							// TEAM MEMBER ke liye share
							else if (rAdminRole?.level === RoleLevel.L3) {
								if (findShare.team_member_share_type === "percentage")
									adjustedAmount =
										(adjustedAmount / 100) *
										(100 - findShare.team_member_share);
								else if (findShare.team_member_share_type === "cutting")
									adjustedAmount -= findShare.team_member_share;
							}
						}

						adjustedAmount = Math.max(0, adjustedAmount);

						// Admin aggregation (TEAM MEMBER)
						const adminId = r.admin.toString();
						const admin = rAdmin || {
							_id: adminId,
							name: "Deleted Account",
							phone: "",
							role: {},
							parent: rAdmin?.parent || null,
						};
						admin.role = roleMap.get(admin.role?._id?.toString()!) || {};

						const existingAdmin = adminsResultMap.get(adminId);
						if (!existingAdmin)
							adminsResultMap.set(adminId, {
								_id: adminId,
								totalAmount: adjustedAmount,
								admin,
							});
						else
							adminsResultMap.set(adminId, {
								...existingAdmin,
								totalAmount: existingAdmin.totalAmount + adjustedAmount,
							});

						// Admin aggregation for MASTER (parent)
						if (admin.parent) {
							const masterId = admin.parent.toString();
							const master = adminsResultMap.get(masterId) || {
								totalAmount: 0,
								admin: {
									_id: masterId,
									name: "Deleted Account",
									phone: "",
									role: roleMap.get(rAdmin?.role?._id?.toString()!) || {},
								},
							};

							adminsResultMap.set(masterId, {
								_id: masterId,
								totalAmount: master.totalAmount + adjustedAmount,
								admin: master.admin,
							});
						}

						const numberKey = r.number?.text || "❓";

						numberResultMap.set(
							numberKey,
							(numberResultMap.get(numberKey) || 0) + adjustedAmount,
						);

						grandTotal += adjustedAmount;
					}

					console.log("🚀 ~ ) Admin Result Map", adminsResultMap);
					console.log("🚀 ~ ) Grand Total", grandTotal);
					// console.log(
					//   "🚀 ~ ) Number Entries",
					//   Array.from(numberResultMap, ([number, amount]) => ({
					//     number,
					//     amount,
					//   }))
					// );
					// console.log(
					//   "🚀 ~ ) Admin Entries",
					//   Array.from(adminsResultMap, ([name, value]) => ({
					//     ...value,
					//   }))
					// );
					return R("grand total", {
						grand_total: grandTotal,
						admin_entries: Array.from(adminsResultMap, ([name, value]) => ({
							...value,
						})),
						number_entries: Array.from(numberResultMap, ([number, amount]) => ({
							number,
							amount,
						})),
						date_range: dateRange,
					});
				},
				rolesSchema.grandTotal,
			),
);
