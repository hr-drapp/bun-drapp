import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import sattaEntrySchema from "./satta_entry.schema";
import Admin from "src/models/drapp/Admin";
import SattaEntry from "src/models/SattaEntry";
import { createElysia } from "src/utils/createElysia";
import moment from "moment";
import SattaNumberEntry from "src/models/SattaNumberEntry";
import Game from "src/models/Game";
import { AnkCategory } from "src/utils/anks";
import Client from "src/models/Client";
import Market from "src/models/Market";
import crypto from "crypto";
import satta_entryController from "./satta_entry.controller";
import SattaResult from "src/models/SattaResult";

export default createElysia({ prefix: "/satta_entry" }).guard(
	{
		detail: {
			tags: ["Satta Entry"],
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
					const game = query.game;
					const category = query.category;
					const today = moment().startOf("day");
					const source = query.source || "default";
					console.log("~~ 🚀🚀 Source Name", source);
					console.log("~~ 🚀🚀 Category", category);
					const list = await SattaEntry.find({
						game: game,
						date: today,
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
						admin: user._id.toString(),
						market: false,
						...(source && {
							source: source,
						}),
					})
						.sort({ createdAt: -1 })
						.skip(page * size)
						.limit(size);

					const total = await SattaEntry.countDocuments({});

					const pages = Math.ceil(total / size);
					// console.log("🚀 Add List", list);

					return R("entry list data", list, true, {
						pages: pages,
						total: total,
						page: page,
						size: size,
					});
				},
				sattaEntrySchema.list,
			)
			.post(
				"/",
				async ({ body, user }) => {
					console.log("🚀 ~~ Body", body);
					const today = moment().startOf("day");

					const game = await Game.findById(body.game);

					if (!game) {
						return customError("Invalid Game");
					}

					if (game.time_range.length) {
						const currentDateTime = moment();

						const currentTime = parseFloat(
							`${currentDateTime.hours()}.${currentDateTime.minutes()}`,
						);

						const startTime = parseFloat(
							`${game.time_range[0][0]}.${game.time_range[0][1]}`,
						);
						const endTime = parseFloat(
							`${game.time_range[1][0]}.${game.time_range[1][1]}`,
						);

						if (currentTime < startTime) {
							return customError("Game has not started yet.");
						}

						if (currentTime > endTime) {
							return customError("Game ended.");
						}
					}

					const entry = await SattaEntry.create({
						...body,
						date: today,
						admin: user._id,
						category: body.category,
					});

					let listEntries = body.numbers.map((item) => {
						return {
							updateMany: {
								filter: {
									admin: user._id,
									category: body.category,
									number: item,
									game: body.game,
									date: today,
								},
								// If you were using the MongoDB driver directly, you'd need to do
								// `update: { $set: { title: ... } }` but mongoose adds $set for
								// you.
								update: {
									$inc: {
										amount: body?.numbers_map?.[item] || body.amount,
									},
								},
							},
						};
					});

					await SattaNumberEntry.bulkWrite(listEntries);
					// console.log("🚀 Add List", entry);

					return R("entry updated", entry);
				},
				sattaEntrySchema.create,
			)

			.post(
				"/mix",
				async ({ body, user }) => {
					console.log("🚀 ~~ Body", body);
					const entryList = await satta_entryController.mixEntry({
						body,
						user,
					});

					return R("entry updated", entryList);
				},
				sattaEntrySchema.create_mix,
			)
			.get(
				"/list-market",
				async ({ query, user }) => {
					const page = parseInt(query.page);
					const size = parseInt(query.size);
					const game = query.game;
					const today = moment().startOf("day");
					const startDate = query.dateFrom || today.startOf("day").toDate();
					const endDate = query.dateTo || today.endOf("day").toDate();

					const list = await Market.find({
						game: game,
						// date: today,
						date: {
							$gte: startDate,
							$lt: endDate,
						},
						admin: user._id.toString(),
					})
						.populate("single jodi pana andar bahar total game ")
						.sort({ createdAt: -1 })
						.lean()
						.skip(page * size)
						.limit(page);

					const total = await Market.countDocuments({});

					// for (let item of list) {
					// 	const single_entry = await SattaEntry.findById(item.single);
					// 	const jodi_entry = await SattaEntry.findById(item.jodi);
					// 	const pana_entry = await SattaEntry.findById(item.pana)

					// }

					const pages = Math.ceil(total / size);

					return R("entry list data", list, true, {
						pages: pages,
						total: total,
						page: page,
						size: size,
					});
				},
				sattaEntrySchema.list_market,
			)

			.post(
				"/add-market",
				async ({ body, user }) => {
					console.log("Calling.....");
					const today = moment().startOf("day");
					console.log("🚀 ~~ Body", body);
					const game = await Game.findById(body.game);

					if (!game) {
						return customError("Invalid Game");
					}

					if (game.time_range.length) {
						console.log("🚀 ~ game.time_range:", game.time_range);
						const currentDateTime = moment();

						const currentTime = parseFloat(
							`${currentDateTime.hours()}.${currentDateTime.minutes()}`,
						);

						console.log("🚀 ~ currentTime:", currentTime);
						const startTime = parseFloat(
							`${game.time_range[0][0]}.${game.time_range[0][1]}`,
						);
						const endTime = parseFloat(
							`${game.time_range[1][0]}.${game.time_range[1][1]}`,
						);
						console.log("🚀 ~ startTime:", startTime);
						console.log("🚀 ~ endTime:", endTime);

						if (currentTime < startTime) {
							return customError("Game has not started yet.");
						}

						if (currentTime > endTime) {
							return customError("Game ended.");
						}
					}

					const single_entry_ids = [];

					if (body.single) {
						for (let item of body.single) {
							const single_entry = await SattaEntry.create({
								...item.result,
								text: item.text,
								date: today,
								admin: user._id,
								category: AnkCategory.SINGLE,
								market: true,
							});

							single_entry_ids.push(single_entry._id.toString());
						}
					}

					let listEntries = body.single
						? body.single.map((single) => {
								return single.result.numbers.map((item) => {
									return {
										updateMany: {
											filter: {
												admin: user._id,
												category: AnkCategory.SINGLE,
												number: item,
												game: body.game,
												date: today,
												market: true,
											},
											// If you were using the MongoDB driver directly, you'd need to do
											// `update: { $set: { title: ... } }` but mongoose adds $set for
											// you.
											update: {
												$inc: {
													amount:
														single?.result?.numbers_map?.[item] ||
														single?.result.amount,
												},
											},
											upsert: true,
										},
									};
								});
						  })
						: [];
					console.log("🚀 ~ listEntries ~ listEntries:", listEntries);

					const jodi_entry_ids = [];

					if (body.jodi) {
						for (let item of body.jodi) {
							const single_entry = await SattaEntry.create({
								...item.result,
								text: item.text,
								date: today,
								admin: user._id,
								category: AnkCategory.JODI,
								market: true,
							});

							jodi_entry_ids.push(single_entry._id.toString());
						}
					}

					let jodiListEntries = body.jodi
						? body.jodi.map((single) => {
								return single.result.numbers.map((item) => {
									return {
										updateMany: {
											filter: {
												admin: user._id,
												category: AnkCategory.JODI,
												number: item,
												game: body.game,
												date: today,
												market: true,
											},
											// If you were using the MongoDB driver directly, you'd need to do
											// `update: { $set: { title: ... } }` but mongoose adds $set for
											// you.
											update: {
												$inc: {
													amount:
														single?.result?.numbers_map?.[item] ||
														single?.result.amount,
												},
											},
											upsert: true,
										},
									};
								});
						  })
						: [];
					console.log(
						"🚀 ~ jodiListEntries ~ jodiListEntries:",
						jodiListEntries,
					);

					const pana_entry_ids = [];

					if (body.pana) {
						for (let item of body.pana) {
							const single_entry = await SattaEntry.create({
								...item.result,
								text: item.text,
								type: item.type,
								date: today,
								admin: user._id,
								category: AnkCategory.PANA,
								market: true,
							});

							pana_entry_ids.push(single_entry._id.toString());
						}
					}

					let panaListEntries = body.pana
						? body.pana.map((single) => {
								return single.result.numbers.map((item) => {
									return {
										updateMany: {
											filter: {
												admin: user._id,
												category: AnkCategory.PANA,
												number: item,
												game: body.game,
												date: today,
												market: true,
											},
											// If you were using the MongoDB driver directly, you'd need to do
											// `update: { $set: { title: ... } }` but mongoose adds $set for
											// you.
											update: {
												$inc: {
													amount:
														single?.result?.numbers_map?.[item] ||
														single?.result.amount,
												},
											},
											upsert: true,
										},
									};
								});
						  })
						: [];
					console.log(
						"🚀 ~ panaListEntries ~ panaListEntries:",
						panaListEntries,
					);

					const andar_entry_ids = [];

					if (body.andar) {
						for (let item of body.andar) {
							const single_entry = await SattaEntry.create({
								...item.result,
								text: item.text,
								date: today,
								admin: user._id,
								category: AnkCategory.ANDAR,
								market: true,
							});

							andar_entry_ids.push(single_entry._id.toString());
						}
					}

					let andarListEntries = body.andar
						? body.andar.map((single) => {
								return single.result.numbers.map((item) => {
									return {
										updateMany: {
											filter: {
												admin: user._id,
												category: AnkCategory.ANDAR,
												number: item,
												game: body.game,
												date: today,
												market: true,
											},
											// If you were using the MongoDB driver directly, you'd need to do
											// `update: { $set: { title: ... } }` but mongoose adds $set for
											// you.
											update: {
												$inc: {
													amount:
														single?.result?.numbers_map?.[item] ||
														single?.result.amount,
												},
											},
											upsert: true,
										},
									};
								});
						  })
						: [];
					console.log(
						"🚀 ~ andarListEntries ~ andarListEntries:",
						andarListEntries,
					);

					const bahar_entry_ids = [];

					if (body.bahar) {
						for (let item of body.bahar) {
							const single_entry = await SattaEntry.create({
								...item.result,
								text: item.text,
								date: today,
								admin: user._id,
								category: AnkCategory.BAHAR,
								market: true,
							});

							bahar_entry_ids.push(single_entry._id.toString());
						}
					}

					let baharListEntries = body.bahar
						? body.bahar.map((single) => {
								return single.result.numbers.map((item) => {
									return {
										updateMany: {
											filter: {
												admin: user._id,
												category: AnkCategory.BAHAR,
												number: item,
												game: body.game,
												date: today,
												market: true,
											},
											// If you were using the MongoDB driver directly, you'd need to do
											// `update: { $set: { title: ... } }` but mongoose adds $set for
											// you.
											update: {
												$inc: {
													amount:
														single?.result?.numbers_map?.[item] ||
														single?.result.amount,
												},
											},
											upsert: true,
										},
									};
								});
						  })
						: [];
					console.log(
						"🚀 ~ baharListEntries ~ baharListEntries:",
						baharListEntries,
					);

					const total_entry_ids = [];

					if (body.total) {
						for (let item of body.total) {
							const single_entry = await SattaEntry.create({
								...item.result,
								text: item.text,
								date: today,
								admin: user._id,
								category: AnkCategory.TOTAL,
								market: true,
							});

							total_entry_ids.push(single_entry._id.toString());
						}
					}

					let totalListEntries = body.total
						? body.total.map((single) => {
								return single.result.numbers.map((item) => {
									return {
										updateMany: {
											filter: {
												admin: user._id,
												category: AnkCategory.TOTAL,
												number: item,
												game: body.game,
												date: today,
												market: true,
											},
											// If you were using the MongoDB driver directly, you'd need to do
											// `update: { $set: { title: ... } }` but mongoose adds $set for
											// you.
											update: {
												$inc: {
													amount:
														single?.result?.numbers_map?.[item] ||
														single?.result.amount,
												},
											},
											upsert: true,
										},
									};
								});
						  })
						: [];
					console.log(
						"🚀 ~ totalListEntries ~ totalListEntries:",
						totalListEntries,
					);

					const bulkList = [
						...listEntries,
						...jodiListEntries,
						...andarListEntries,
						...baharListEntries,
						...totalListEntries,
						...panaListEntries,
					].flat();
					console.log("🚀 ~ bulkList:", bulkList);
					await SattaNumberEntry.bulkWrite(bulkList);

					const token = crypto.randomBytes(5).toString("hex");
					console.log("🚀 ~ token:", token);

					const market = await Market.create({
						admin: user._id,
						client_name: body.client_name,
						date: today,
						game: body.game,
						single: single_entry_ids,
						jodi: jodi_entry_ids,
						pana: pana_entry_ids,
						andar: andar_entry_ids,
						bahar: bahar_entry_ids,
						total: total_entry_ids,
						type: body.type,
						token: token,
					});

					return R("entry updated", market);
				},
				sattaEntrySchema.add_market,
			)
			.put(
				"/",
				async ({ body, query }) => {
					// const entry = await SattaEntry.findByIdAndUpdate(query.id, body);

					return R("entry updated", {});
				},
				sattaEntrySchema.update,
			)

			.put(
				"/market-payment-complete",
				async ({ body, query }) => {
					const entry = await Market.findByIdAndUpdate(query.id, {
						payment_completed: true,
					});

					return R("entry updated", {});
				},
				sattaEntrySchema.complete_payment,
			)
			.delete(
				"/market-delete",
				async ({ body, query }) => {
					const entry = await Market.findOneAndDelete({ _id: query.id });

					return R("entry updated", {});
				},
				sattaEntrySchema.delete_payment,
			)

			.put(
				"/add-client",
				async ({ body }) => {
					let entry = await Client.findOne({
						name: body.name,
					});

					if (entry) {
						return customError("Duplicate Client Name");
					}

					entry = await Client.create({
						name: body.name,
					});

					return R("entry updated", entry);
				},
				sattaEntrySchema.add_client,
			)
			.delete(
				"/",
				async ({ query, user }) => {
					const entry = await SattaEntry.findByIdAndDelete(query.id);

					console.log("🚀 ~ entry:", entry);
					if (entry) {
						const game = await Game.findById(entry.game);

						if (!game) {
							return customError("Invalid Game");
						}

						if (game.time_range.length) {
							const currentDateTime = moment();

							const currentTime = parseFloat(
								`${currentDateTime.hours()}.${currentDateTime.minutes()}`,
							);

							const startTime = parseFloat(
								`${game.time_range[0][0]}.${game.time_range[0][1]}`,
							);
							const endTime = parseFloat(
								`${game.time_range[1][0]}.${game.time_range[1][1]}`,
							);

							if (currentTime < startTime) {
								return customError("Game has not started yet.");
							}

							if (currentTime > endTime) {
								return customError("Game ended.");
							}
						}

						let listEntries = entry.numbers.map((item, i) => {
							return {
								updateMany: {
									filter: {
										admin: user._id,
										category: entry.category,
										number: item,
										game: entry.game,
										date: entry.date,
									},
									// If you were using the MongoDB driver directly, you'd need to do
									// `update: { $set: { title: ... } }` but mongoose adds $set for
									// you.
									update: {
										$inc: {
											amount: entry?.numbers_map?.[item]
												? -parseFloat(entry?.numbers_map[item])
												: -entry.amount,
										},
									},
								},
							};
						});

						await SattaNumberEntry.bulkWrite(listEntries);
					}

					return R("entry updated", entry);
				},
				sattaEntrySchema.delete,
			)
			.delete(
				"/reset",
				async ({ query, user }) => {
					const entry = await SattaEntry.findOneAndDelete({
						game: query.game,
						...(query.category == AnkCategory.JODI
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
							: { category: query.category }),
						admin: user._id,
					}).sort({ createdAt: -1 });

					console.log("🚀 ~ entry:", entry);
					if (entry) {
						const game = await Game.findById(entry.game);

						if (!game) {
							return customError("Invalid Game");
						}

						if (game.time_range.length) {
							const currentDateTime = moment();

							const currentTime = parseFloat(
								`${currentDateTime.hours()}.${currentDateTime.minutes()}`,
							);

							const startTime = parseFloat(
								`${game.time_range[0][0]}.${game.time_range[0][1]}`,
							);
							const endTime = parseFloat(
								`${game.time_range[1][0]}.${game.time_range[1][1]}`,
							);

							if (currentTime < startTime) {
								return customError("Game has not started yet.");
							}

							if (currentTime > endTime) {
								return customError("Game ended.");
							}
						}

						let listEntries = entry.numbers.map((item, i) => {
							return {
								updateMany: {
									filter: {
										admin: user._id,
										category: entry.category,
										number: item,
										game: entry.game,
										date: entry.date,
									},
									// If you were using the MongoDB driver directly, you'd need to do
									// `update: { $set: { title: ... } }` but mongoose adds $set for
									// you.
									update: {
										$inc: {
											amount: entry?.numbers_map?.[item]
												? -entry?.numbers_map?.[item]
												: -entry.amount,
										},
									},
								},
							};
						});

						await SattaNumberEntry.bulkWrite(listEntries);
					}

					return R("entry updated", entry);
				},
				sattaEntrySchema.reset,
			),
);
