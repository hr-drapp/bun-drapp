import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import rolesSchema from "./dashboard.schema";
import Admin, { AdminClass } from "src/models/drapp/Admin";
import { createElysia } from "src/utils/createElysia";
import moment from "moment";
import SattaEntry from "src/models/SattaEntry";
import Role, { RoleClass } from "src/models/Role";
import { Schema } from "mongoose";
import SattaNumberEntry from "src/models/SattaNumberEntry";
import SattaNumberEntryShare from "src/models/SattaNumberEntryShare";
import { AnkCategory, anks } from "src/utils/anks";

export default createElysia({ prefix: "/dashboard" }).guard(
	{
		detail: {
			tags: ["Dashboard"],
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

					const MASTER = "MASTER";
					const TEAM_MEMBER = "TEAM MEMBER";

					const filter = {} as Record<any, any>;
					if (!user.super_admin) {
						filter.parent = user._id;
					}

					const roles = await Role.find({
						name: {
							$in: [MASTER, TEAM_MEMBER],
						},
					}).select("_id name");

					const masterRole = roles.find((f) => f.name === MASTER);
					const teamMemberRole = roles.find((f) => f.name === TEAM_MEMBER);

					const masterIdsEntity = await Admin.find({
						role: masterRole?._id,
						...filter,
					})
						.select("_id")
						.lean();
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

					const todays_total_amount = await SattaEntry.aggregate([
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

					const total_master_contribution = await SattaEntry.aggregate([
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

					const total_team_member_contribution = await SattaEntry.aggregate([
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
				"/grand_total",
				async ({ body, user }) => {
					console.log("🚀 ~ Body", body);
					const category = body.category;
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

					const gameIds = body.game_ids || [];

					if (role?.name === "TEAM MEMBER") {
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
						categoryJodi: category == AnkCategory.JODI,
					});

					const sattaNumberEntries = await SattaNumberEntry.find({
						date: {
							$gte: startDate,
							$lt: endDate,
						},
						...(category == AnkCategory.JODI
							? {
									category: {
										$in: [
											AnkCategory.JODI,
											AnkCategory.ANDAR,
											AnkCategory.BAHAR,
											AnkCategory.TOTAL,
										],
									},
							  }
							: { category: category }),
						...(adminIds.length
							? {
									admin: { $in: adminIds },
							  }
							: !user.super_admin
							? { parent: user._id }
							: {}),
						...(gameIds.length
							? {
									game: {
										$in: gameIds,
									},
							  }
							: {}),
					}).sort({ admin: -1 });

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
					}).select("_id name");

					const roleMap = new Map();

					for (let r of roles) {
						roleMap.set(r._id.toString(), r);
					}
					let grandTotal = 0;

					const ank = (anks as any)[category as any];

					const adminsResultMap = new Map();
					const numberResultMap = new Map(
						ank
							? ank.map((item: any) => [item, { amount: 0, category: "1" }])
							: [
									[1, { amount: 0, category: "1" }],
									[2, { amount: 0, category: "1" }],
									[3, { amount: 0, category: "1" }],
									[4, { amount: 0, category: "1" }],
									[5, { amount: 0, category: "1" }],
									[6, { amount: 0, category: "1" }],
									[7, { amount: 0, category: "1" }],
									[8, { amount: 0, category: "1" }],
									[9, { amount: 0, category: "1" }],
									[0, { amount: 0, category: "1" }],
							  ],
					) as any;

					const andarResultMap = new Map(
						anks[AnkCategory.ANDAR].map((item: any) => [
							item,
							{ amount: 0, category: AnkCategory.ANDAR as any },
						]),
					);
					const baharResultMap = new Map(
						anks[AnkCategory.BAHAR].map((item: any) => [
							item,
							{ amount: 0, category: AnkCategory.BAHAR as any },
						]),
					);
					const totalResultMap = new Map(
						anks[AnkCategory.TOTAL].map((item: any) => [
							item,
							{ amount: 0, category: AnkCategory.TOTAL as any },
						]),
					);

					// const result = [] as { admins: { _id: string, totalAmount: number, admin: AdminClass }[], numbers: { number: number, amount: number }[] }[]
					console.log("ADMIN ID: ", adminIds);
					const share = await SattaNumberEntryShare.find({
						date: {
							$gte: startDate,
							$lt: endDate,
						},
						category: category,
						...(adminIds.length
							? {
									admin: { $in: adminIds },
							  }
							: !user.super_admin
							? { parent: user._id }
							: {}),
						...(gameIds.length
							? {
									game: {
										$in: gameIds,
									},
							  }
							: {}),
					}).lean();
					console.log("🚀 ~ ).post ~ share:", share);

					for (let r of sattaNumberEntries as any) {
						r.actual_amount = r.amount;
						let adjustedAmount = r.amount;

						const rAdmin = adminMap.get(r.admin.toString());

						const findShare = share.find(
							(f) =>
								f.game.toString() === r.game.toString() &&
								(f.admin.toString() === r.admin.toString() ||
									f.admin.toString() === rAdmin?.parent?.toString()),
						);

						const rAdminRole = roleMap.get(rAdmin?.role?._id?.toString() || "");

						if (findShare) {
							// SUPER ADMIN ke liye share
							if (rAdminRole?.name === "SUPER ADMIN") {
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
							else if (rAdminRole?.name === "MASTER") {
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
							else if (rAdminRole?.name === "TEAM MEMBER") {
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

						// Number aggregation
						const updateResultMap = (
							map: Map<any, any>,
							number: any,
							adjustedAmount: number,
							category: string,
						) => {
							const existing = map.get(number);
							if (!existing) {
								map.set(number, { amount: adjustedAmount, category });
							} else {
								map.set(number, {
									...existing,
									amount: existing.amount + adjustedAmount,
								});
							}
						};

						if (category == AnkCategory.JODI) {
							if (r.category == AnkCategory.ANDAR) {
								updateResultMap(
									andarResultMap,
									r.number,
									adjustedAmount,
									AnkCategory.ANDAR,
								);
							} else if (r.category == AnkCategory.BAHAR) {
								updateResultMap(
									baharResultMap,
									r.number,
									adjustedAmount,
									AnkCategory.BAHAR,
								);
							} else if (r.category == AnkCategory.TOTAL) {
								updateResultMap(
									totalResultMap,
									r.number,
									adjustedAmount,
									AnkCategory.TOTAL,
								);
							} else {
								updateResultMap(
									numberResultMap,
									r.number,
									adjustedAmount,
									r.category.toString(),
								);
							}
						} else {
							updateResultMap(
								numberResultMap,
								r.number,
								adjustedAmount,
								r.category.toString(),
							);
						}
						grandTotal += adjustedAmount;
					}

					console.log("🚀 ~ ) Admin Result Map", adminsResultMap);
					return R("grand total", {
						grand_total: grandTotal,
						admin_entries: Array.from(adminsResultMap, ([name, value]) => ({
							...value,
						})),
						number_entries: Array.from(
							[
								...numberResultMap,
								...(category == AnkCategory.JODI
									? [...andarResultMap, ...baharResultMap, ...totalResultMap]
									: []),
							],
							([name, value]) => ({
								number: name,
								amount: value.amount,
								category: value.category,
							}),
						),
						date_range: dateRange,
					});
				},
				rolesSchema.grandTotal,
			),
	// .post(
	//   "/grand_total",
	//   async ({ body, user }) => {
	//     const category = body.category;
	//     const role = user.role as RoleClass;
	//     const today = moment();
	//     const admin_Type = body.admin_type;

	//     const startDate = body.date_from || today.startOf("day").toDate();
	//     const endDate = body.date_to || today.endOf("day").toDate();

	//     const dateRange = `${moment(startDate).format(
	//       "DD-MM-YYYY HH:mm"
	//     )} - ${moment(endDate).format("DD-MM-YYYY HH:mm")}`;

	//     let adminIds = body.admin_ids || [];
	//     const gameIds = body.game_ids || [];

	//     const filter: Record<any, any> = {};
	//     if (admin_Type === "customer") filter.is_customer = true;
	//     else if (admin_Type === "normal") filter.is_customer = false;
	//     if (!user.super_admin) filter.parent = user._id;

	//     // Admin fetch logic
	//     if (adminIds.length || adminIds.includes("all")) {
	//       if (adminIds.includes("all") && user.super_admin) {
	//         const admins = await Admin.find({ ...filter })
	//           .sort({ role: -1 })
	//           .select("_id name phone role parent")
	//           .lean();
	//         adminIds = admins.map((item) => item._id.toString());
	//       } else if (user.super_admin) {
	//         const admins = await Admin.find({
	//           $or: [
	//             { _id: { $in: adminIds } },
	//             { parent: { $in: adminIds } },
	//           ],
	//           ...filter,
	//         })
	//           .sort({ role: -1 })
	//           .select("_id name phone role parent")
	//           .lean();
	//         adminIds = admins.map((item) => item._id.toString());
	//       }
	//     }

	//     const sattaNumberEntries = await SattaNumberEntry.find({
	//       date: { $gte: startDate, $lt: endDate },
	//       ...(category == AnkCategory.JODI
	//         ? {
	//             category: {
	//               $in: [
	//                 AnkCategory.JODI,
	//                 AnkCategory.ANDAR,
	//                 AnkCategory.BAHAR,
	//                 AnkCategory.TOTAL,
	//               ],
	//             },
	//           }
	//         : { category }),
	//       ...(adminIds.length
	//         ? { admin: { $in: adminIds } }
	//         : !user.super_admin
	//         ? { parent: user._id }
	//         : {}),
	//       ...(gameIds.length ? { game: { $in: gameIds } } : {}),
	//     }).sort({ admin: -1 });

	//     const admins = await Admin.find({ _id: { $in: adminIds }, ...filter })
	//       .sort({ role: -1 })
	//       .select("_id name phone role parent")
	//       .lean();
	//     const adminMap = new Map(admins.map((a) => [a._id.toString(), a]));

	//     const roles = await Role.find({
	//       _id: { $in: admins.map((a) => a.role.toString()) },
	//     }).select("_id name");
	//     const roleMap = new Map(roles.map((r) => [r._id.toString(), r]));

	//     const share = await SattaNumberEntryShare.find({
	//       date: { $gte: startDate, $lt: endDate },
	//       category,
	//       ...(adminIds.length
	//         ? { admin: { $in: adminIds } }
	//         : !user.super_admin
	//         ? { parent: user._id }
	//         : {}),
	//       ...(gameIds.length ? { game: { $in: gameIds } } : {}),
	//     }).lean();

	//     let grandTotal = 0;
	//     const adminsResultMap = new Map<
	//       string,
	//       { _id: string; totalAmount: number; admin: any }
	//     >();
	//     const numberResultMap = new Map<
	//       number,
	//       { amount: number; category: string }
	//     >();

	//     // for (let r of sattaNumberEntries as any) {
	//     //   r.actual_amount = r.amount;
	//     //   let adjustedAmount = r.amount;

	//     //   const rAdmin = adminMap.get(r.admin.toString());

	//     //   const findShare = share.find(
	//     //     (f) =>
	//     //       f.game.toString() === r.game.toString() &&
	//     //       (f.admin.toString() === r.admin.toString() ||
	//     //         f.admin.toString() === rAdmin?.parent?.toString())
	//     //   );
	//     //   // console.log("Find Share", findShare);
	//     //   const rAdminRole = roleMap.get(rAdmin?.role?._id?.toString() || "");

	//     //   if (findShare) {
	//     //     // SUPER ADMIN ke liye share apply karo
	//     //     if (rAdminRole?.name === "SUPER ADMIN") {
	//     //       if (findShare.super_admin_share_type === "percentage")
	//     //         adjustedAmount =
	//     //           (adjustedAmount / 100) *
	//     //           (100 - findShare.super_admin_share);
	//     //       else if (findShare.super_admin_share_type === "cutting")
	//     //         adjustedAmount -= findShare.super_admin_share;

	//     //       if (findShare.master_share_type === "percentage")
	//     //         adjustedAmount =
	//     //           (adjustedAmount / 100) * (100 - findShare.master_share);
	//     //       else if (findShare.master_share_type === "cutting")
	//     //         adjustedAmount -= findShare.master_share;

	//     //       if (findShare.team_member_share_type === "percentage")
	//     //         adjustedAmount =
	//     //           (adjustedAmount / 100) *
	//     //           (100 - findShare.team_member_share);
	//     //       else if (findShare.team_member_share_type === "cutting")
	//     //         adjustedAmount -= findShare.team_member_share;
	//     //     }
	//     //     // MASTER ke liye share apply karo
	//     //     else if (rAdminRole?.name === "MASTER") {
	//     //       if (findShare.master_share_type === "percentage")
	//     //         adjustedAmount =
	//     //           (adjustedAmount / 100) * (100 - findShare.master_share);
	//     //       else if (findShare.master_share_type === "cutting")
	//     //         adjustedAmount -= findShare.master_share;

	//     //       if (findShare.team_member_share_type === "percentage")
	//     //         adjustedAmount =
	//     //           (adjustedAmount / 100) *
	//     //           (100 - findShare.team_member_share);
	//     //       else if (findShare.team_member_share_type === "cutting")
	//     //         adjustedAmount -= findShare.team_member_share;
	//     //     }
	//     //   }

	//     //   adjustedAmount = Math.max(0, adjustedAmount);

	//     //   // Admin aggregation
	//     //   const adminId = r.admin.toString();
	//     //   const admin = rAdmin || {
	//     //     name: "Deleted Account",
	//     //     phone: "",
	//     //     role: {},
	//     //   };
	//     //   admin.role = roleMap.get(admin.role?._id?.toString()!) || {};

	//     //   const existingAdmin = adminsResultMap.get(adminId);
	//     //   if (!existingAdmin)
	//     //     adminsResultMap.set(adminId, {
	//     //       _id: adminId,
	//     //       totalAmount: adjustedAmount,
	//     //       admin,
	//     //     });
	//     //   else
	//     //     adminsResultMap.set(adminId, {
	//     //       ...existingAdmin,
	//     //       totalAmount: existingAdmin.totalAmount + adjustedAmount,
	//     //     });

	//     //   // Number aggregation
	//     //   const numberMap = numberResultMap.get(r.number);
	//     //   if (!numberMap)
	//     //     numberResultMap.set(r.number, {
	//     //       amount: adjustedAmount,
	//     //       category: r.category.toString(),
	//     //     });
	//     //   else
	//     //     numberResultMap.set(r.number, {
	//     //       amount: numberMap.amount + adjustedAmount,
	//     //       category: r.category.toString(),
	//     //     });

	//     //   grandTotal += adjustedAmount;
	//     // }
	//     for (let r of sattaNumberEntries as any) {
	//       r.actual_amount = r.amount;
	//       let adjustedAmount = r.amount;

	//       const rAdmin = adminMap.get(r.admin.toString());

	//       const findShare = share.find(
	//         (f) =>
	//           f.game.toString() === r.game.toString() &&
	//           (f.admin.toString() === r.admin.toString() ||
	//             f.admin.toString() === rAdmin?.parent?.toString())
	//       );

	//       const rAdminRole = roleMap.get(rAdmin?.role?._id?.toString() || "");

	//       if (findShare) {
	//         // SUPER ADMIN ke liye share
	//         if (rAdminRole?.name === "SUPER ADMIN") {
	//           if (findShare.super_admin_share_type === "percentage")
	//             adjustedAmount =
	//               (adjustedAmount / 100) *
	//               (100 - findShare.super_admin_share);
	//           else if (findShare.super_admin_share_type === "cutting")
	//             adjustedAmount -= findShare.super_admin_share;

	//           if (findShare.master_share_type === "percentage")
	//             adjustedAmount =
	//               (adjustedAmount / 100) * (100 - findShare.master_share);
	//           else if (findShare.master_share_type === "cutting")
	//             adjustedAmount -= findShare.master_share;

	//           if (findShare.team_member_share_type === "percentage")
	//             adjustedAmount =
	//               (adjustedAmount / 100) *
	//               (100 - findShare.team_member_share);
	//           else if (findShare.team_member_share_type === "cutting")
	//             adjustedAmount -= findShare.team_member_share;
	//         }
	//         // MASTER ke liye share
	//         else if (rAdminRole?.name === "MASTER") {
	//           if (findShare.master_share_type === "percentage")
	//             adjustedAmount =
	//               (adjustedAmount / 100) * (100 - findShare.master_share);
	//           else if (findShare.master_share_type === "cutting")
	//             adjustedAmount -= findShare.master_share;

	//           if (findShare.team_member_share_type === "percentage")
	//             adjustedAmount =
	//               (adjustedAmount / 100) *
	//               (100 - findShare.team_member_share);
	//           else if (findShare.team_member_share_type === "cutting")
	//             adjustedAmount -= findShare.team_member_share;
	//         }
	//         // TEAM MEMBER ke liye share
	//         else if (rAdminRole?.name === "TEAM MEMBER") {
	//           if (findShare.team_member_share_type === "percentage")
	//             adjustedAmount =
	//               (adjustedAmount / 100) *
	//               (100 - findShare.team_member_share);
	//           else if (findShare.team_member_share_type === "cutting")
	//             adjustedAmount -= findShare.team_member_share;
	//         }
	//       }

	//       adjustedAmount = Math.max(0, adjustedAmount);

	//       // Admin aggregation (TEAM MEMBER)
	//       const adminId = r.admin.toString();
	//       const admin = rAdmin || {
	//         _id: adminId,
	//         name: "Deleted Account",
	//         phone: "",
	//         role: {},
	//         parent: rAdmin?.parent || null,
	//       };
	//       admin.role = roleMap.get(admin.role?._id?.toString()!) || {};

	//       const existingAdmin = adminsResultMap.get(adminId);
	//       if (!existingAdmin)
	//         adminsResultMap.set(adminId, {
	//           _id: adminId,
	//           totalAmount: adjustedAmount,
	//           admin,
	//         });
	//       else
	//         adminsResultMap.set(adminId, {
	//           ...existingAdmin,
	//           totalAmount: existingAdmin.totalAmount + adjustedAmount,
	//         });

	//       // Admin aggregation for MASTER (parent)
	//       if (admin.parent) {
	//         const masterId = admin.parent.toString();
	//         const master = adminsResultMap.get(masterId) || {
	//           totalAmount: 0,
	//           admin: {
	//             _id: masterId,
	//             name: "Deleted Account",
	//             phone: "",
	//             role: roleMap.get(rAdmin?.role?._id?.toString()!) || {},
	//           },
	//         };

	//         adminsResultMap.set(masterId, {
	//           _id: masterId,
	//           totalAmount: master.totalAmount + adjustedAmount,
	//           admin: master.admin,
	//         });
	//       }

	//       // Number aggregation
	//       const numberMap = numberResultMap.get(r.number);
	//       if (!numberMap)
	//         numberResultMap.set(r.number, {
	//           amount: adjustedAmount,
	//           category: r.category.toString(),
	//         });
	//       else
	//         numberResultMap.set(r.number, {
	//           amount: numberMap.amount + adjustedAmount,
	//           category: r.category.toString(),
	//         });

	//       grandTotal += adjustedAmount;
	//     }

	//     return R("grand total", {
	//       grand_total: grandTotal,
	//       admin_entries: Array.from(adminsResultMap.values()),
	//       number_entries: Array.from(numberResultMap.entries()).map(
	//         ([number, value]) => ({
	//           number,
	//           amount: value.amount,
	//           category: value.category,
	//         })
	//       ),
	//       date_range: dateRange,
	//     });
	//   },
	//   rolesSchema.grandTotal
	// )
);
