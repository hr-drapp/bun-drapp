import { createElysia } from "src/utils/createElysia";
import schema from "./wati.schema";
import { R } from "src/utils/response-helpers";
import Wati from "src/utils/Wati";
import wassenger from "src/utils/Was";
import AppErr, { customError } from "src/utils/AppErr";
import {
	isABRCP,
	isABRP,
	isAndar,
	isBahar,
	isCdp,
	isCp,
	isCsp,
	isDL,
	isDp,
	isDPMOTOR,
	isJdp,
	isJdpcp,
	isJodi,
	isLadi,
	isPana,
	isSETP,
	isSingle,
	isSL,
	isSp,
	isSPMOTOR,
	isTotal,
	isTp,
	parseMixBetText,
	isFL,
	isCROSSING,
	isCJCK,
} from "src/utils/numbers";
import satta_entryController from "src/api/admin/satta_entry/satta_entry.controller";
import Game from "src/models/Game";
import Admin from "src/models/drapp/Admin";
import moment from "moment";
import Group, { GroupBeatTypeEnum } from "src/models/Group";
import { group, log } from "console";
import SattaEntry from "src/models/SattaEntry";
import { AnkCategory } from "src/utils/anks";
import SattaNumberEntry from "src/models/SattaNumberEntry";
import Whapi from "src/utils/Whapi";
import {
	messageQueue,
	testmessageQueue,
	testPersikopQueue,
} from "src/utils/bullmq";
import otp from "src/utils/otp";
import Message, { messageStatus } from "src/models/Message";
import Persikop from "src/utils/Periskop";
import MessageReactQueue, {
	MessageReactQueueStatus,
} from "src/models/MessageReactQueue";
import MessageQueue from "src/models/MessageQueue";
import { WebhookLogger } from "src/utils/webhookLogger";
import fs from "fs";
import path from "path";
import { Logger } from "src/utils/Logger";
import GameTime from "src/models/GameTime";
import parseEmojiAmounts, {
	buildSupportiveEmojiIndex,
	minuteToTimeRange,
} from "src/utils/common";
import numbersEntryController from "src/api/admin/numbers-entry/numbers-entry.controller";
import NumbersEntry from "src/models/NumbersEntry";
import Numbers from "src/models/Numbers";
import GameNumber from "src/models/GameNumber";
import GroupGameTime from "src/models/GroupGameTime";
import NumberEntryTransection from "src/models/NumberEntryTransection";
import mongoose, { Types } from "mongoose";
import { reverseWalletUsage } from "src/utils/wallet";

const logFilePath = path.join("./temp/webhook.log");

const wati = new Wati();
const Was = new wassenger();
const adminTypes = [
	{
		name: "jodi mix",
		type: "Gali Disawar",
	},
	{
		name: "mix",
		type: "Milan Kalyan",
	},
];

async function getSupportiveEmojiIndex(game_id: string) {
	const gameNumbers = await GameNumber.find({ game: game_id })
		.populate("number")
		.select({ number: 1 })
		.lean();

	const numberIds = gameNumbers.map((g) => g.number._id);

	if (!numberIds.length) return null;

	const entries = await Numbers.find({
		_id: { $in: numberIds },
		texts: { $exists: true, $ne: "" },
		text: { $exists: true, $ne: "" },
	})
		.select({ text: 1, texts: 1 })
		.lean();

	const supportiveEmojiIndex = buildSupportiveEmojiIndex(entries);

	return supportiveEmojiIndex;
}

/** TESTING PURPOSE */
let counter = 0;

export default createElysia({ prefix: "/wati" }).guard(
	{
		detail: {
			tags: ["Wati"],
		},
	},
	(app) =>
		app
			.post(
				"/periskope-webhook",
				async (ctx) => {
					// WebhookLogger(ctx, "REQEST", (ctx.body as any).data);
					const logger = new Logger();
					try {
						const logPrefix = "[periskope-webhook]";
						// console.log(logPrefix, "raw ctx.body", ctx.body);
						const body = ctx.body as any;
						// console.log(logPrefix, "parsed body", body);
						const messages = body.data;
						// console.log(logPrefix, "messages payload", messages);

						logger.add(`messagePyaloyd: ${messages.body}`);

						if (!messages) {
							logger.add("Message Missing From Body");
							return customError("InValid Body Format");
						}

						// Own Message Ignore
						if (messages.from_me) {
							console.log(logPrefix, "ignoring own message", messages.id);
							// WebhookLogger(ctx, "INFO", {
							//   message: "Own Message Ignore",
							//   id: messages?.id,
							// });

							logger.add(`Own Mesage Ingnore: ${messages?.id}`);
							return customError("Own Message Ignored");
						}

						const groupId = messages.chat_id;
						console.log(logPrefix, "groupId", groupId);

						logger.add(`GroupId:${groupId}`);

						if (!groupId.includes("@g.us") && !messages.is_group) {
							logger.add(
								`groupId missing @g.us suffix and message not marked as group`,
							);
							return customError("InValid Group Id");
						}

						let exitsGroup = await Group.findOne({ groupId });
						console.log(
							logPrefix,
							"existing group lookup result",
							exitsGroup?._id,
						);
						let group = exitsGroup;

						if (!exitsGroup?.messageId) {
							console.log(
								logPrefix,
								"group missing messageId, updating with",
								messages.id?.id,
							);
							group = await Group.findByIdAndUpdate(
								exitsGroup?._id,
								{ $set: { messageId: messages.id?.id } },
								{ new: true },
							);
							logger.add(`MesageId Updated In Group: ${group?._id} Group Id`);
							console.log(
								logPrefix,
								"group after messageId update",
								group?._id,
							);
						}

						if (!group) {
							console.log(logPrefix, "group not found for groupId", groupId);
							logger.add(`Group Not Found: ${groupId}`);
							return customError("Group Not Found");
						}

						if (messages?.message_type !== "chat" || !messages.body) {
							console.log(
								logPrefix,
								"invalid message type or missing body",
								messages?.message_type,
							);

							logger.add(
								`Invalid Message Type Or Body Missing : ${messages?.message_type}`,
							);
							return customError("Send Valid Text");
						}

						const phone = messages.sender_phone
							?.replace("@c.us", "")
							.replace(/^91/, "");

						console.log(logPrefix, "sanitized phone", phone);

						if (!phone) {
							console.log(logPrefix, "phone missing after sanitization");
							logger.add("phone missing after sanitization");
							return customError("Provide Valid  Number");
						}

						const admin = await Admin.findOne({ phone: phone });
						console.log(logPrefix, "admin lookup result", admin?._id);

						if (!admin) {
							console.log(
								logPrefix,
								"admin not found, queuing message to group",
								groupId,
							);

							logger.add(
								`Admin Not Found,Provided Number Not Found In Members: ${phone}`,
							);
							await MessageQueue.create({
								group: messages.chat_id,
								quotedId: messages.id?.id,
								text: "Provided Number Not Found In Members",
								reaction: "🚨",
							});
							return customError("Provided Number Not Found In Members");
						}

						const currentTime = moment().diff(
							moment().startOf("day"),
							"minutes",
						);
						console.log(logPrefix, "currentTime minutes", currentTime);
						const game = await Game.findOne({
							start_time: { $lte: currentTime },
							end_time: { $gte: currentTime },
							_id: { $in: group?.gameId },
						});
						console.log(logPrefix, "active game lookup result", game?._id);

						if (!game) {
							console.log(
								logPrefix,
								"no active game found, notifying group",
								groupId,
							);

							logger.add(`Active Game Not Found,Game Time Out: ${groupId}`);

							await MessageQueue.create({
								group: messages.chat_id,
								quotedId: messages.id?.id,
								text: `💫_*Game Time Out*_💫\n_*( खेल समय समाप्त)*_\n🚫❌❌❌🚫\n🤔🤔🤔🤔🤔🤔🤔`,
								reaction: "🚨",
							});
							return customError("Game Not Found On This Time");
						}

						console.log(logPrefix, "creating reaction entry", messages.id?.id);
						/* [MRQ_DISABLED] await MessageReactQueue.create({
							message_id: messages.id?.id,
							reaction: "✍",
							status: MessageReactQueueStatus.PENDING,
						}); */
						const createdMessage = await Message.create({
							text: messages.body,
							messageId: messages.id?.id,
							group: group._id,
							user: admin._id,
							status: messageStatus.Pending,
						});

						console.log(
							logPrefix,
							"message entry created",
							createdMessage?._id,
						);

						logger.add(
							`Message Entry Created In Database: ${createdMessage?._id}`,
						);
						const beatType = messages.body
							.split("\n")
							.map((b: string) =>
								b
									.replace(/\s*=\s*/g, "=")
									.replace(/\s+/g, " ")
									.trim(),
							)
							.filter((b: string) => b.length > 0);

						console.log(logPrefix, "normalized beat lines", beatType);

						const deleteType = ["delete", "cancel", "❌", "✖"];
						console.log(logPrefix, "delete keywords matched", {
							hasDeleteKeyword: deleteType.some((d) =>
								messages.body.toLowerCase().includes(d),
							),
							quotedMessageId: messages.quoted_message_id,
						});
						if (
							deleteType.some((d) => messages.body.toLowerCase().includes(d)) &&
							messages.quoted_message_id
						) {
							console.log(
								logPrefix,
								"delete request detected for",
								messages.quoted_message_id,
							);

							logger.add(
								`Delete Request Detected For:${messages?.quoted_message_id}`,
							);
							const entries = await SattaEntry.find({
								messageId: messages.quoted_message_id,
							});
							console.log(logPrefix, "entries to delete", entries.length);

							for (let entry of entries) {
								console.log(logPrefix, "deleting entry", entry?._id);
								await SattaEntry.findByIdAndDelete(entry._id);
								let listEntries = entry?.numbers.map((item) => ({
									updateMany: {
										filter: {
											admin: admin._id,
											category: entry?.category,
											number: item,
											game: entry?.game,
											date: entry?.date,
										},
										update: {
											$inc: {
												amount: entry?.numbers_map?.[item]
													? -entry?.numbers_map?.[item]
													: -entry?.amount,
											},
										},
									},
								}));

								console.log(logPrefix, "reverting satta number entries", {
									updates: listEntries?.length,
								});
								await SattaNumberEntry.bulkWrite(listEntries ?? []);
							}

							console.log(logPrefix, "acknowledging delete request to queue");
							await MessageQueue.create({
								group: messages.chat_id,
								quotedId: messages.id?.id,
								text: `OK ${messages.body}`,
								reaction: "❌",
							});

							return R("Entry deleted");
						}
						console.log(logPrefix, "beatType array", beatType);

						const groupMix = beatType.every(
							(beat: any) =>
								isSingle(beat || "") ||
								isJodi(beat || "") ||
								isABRCP(beat || "") ||
								isSPMOTOR(beat || "") ||
								isABRP(beat || "") ||
								isJdpcp(beat || "") ||
								isSETP(beat || "") ||
								isDPMOTOR(beat || "") ||
								isCp(beat || "") ||
								isSp(beat || "") ||
								isDp(beat || "") ||
								isTp(beat || "") ||
								isJdp(beat || "") ||
								isLadi(beat || "") ||
								isCdp(beat || "") ||
								isCsp(beat || "") ||
								isPana(beat || ""),
						);

						const groupJodiMix = beatType.some(
							(beat: any) =>
								isJodi(beat || "") ||
								isAndar(beat || "") ||
								isBahar(beat || "") ||
								isTotal(beat || "") ||
								isSL(beat || "") ||
								isFL(beat || "") ||
								isDL(beat || "") ||
								isCROSSING(beat || "") ||
								isCJCK(beat || "") ||
								isLadi(beat || ""),
						);

						const isAllValidMix = beatType.every(
							(beat: any) =>
								isSingle(beat || "") ||
								isJodi(beat || "") ||
								isABRCP(beat || "") ||
								isSPMOTOR(beat || "") ||
								isABRP(beat || "") ||
								isJdpcp(beat || "") ||
								isSETP(beat || "") ||
								isDPMOTOR(beat || "") ||
								isCp(beat || "") ||
								isSp(beat || "") ||
								isDp(beat || "") ||
								isTp(beat || "") ||
								isJdp(beat || "") ||
								isLadi(beat || "") ||
								isCdp(beat || "") ||
								isCsp(beat || "") ||
								isPana(beat || ""),
						);

						console.log(logPrefix, "groupMix", groupMix);
						console.log(logPrefix, "groupJodiMix", groupJodiMix);
						console.log(logPrefix, "group type", group.type);

						if (group.type == "mix") {
							if (!isAllValidMix || !groupMix) {
								console.log(logPrefix, "invalid mix message detected", {
									isAllValidMix,
									groupMix,
								});

								logger.add(`Invalid Message In Mix Group `);
								await MessageQueue.create({
									group: messages.chat_id || "",
									quotedId: messages.id?.id || "",
									text: `😡_*Wrong Message*_😡\n❌_*(ग़लत संदेश)*_❌\n🚫❌❌❌❌❌🚫\n\n\n👇🏼🙏🙏🙏🙏🙏👇🏼\n_*Send The Correct Message; Examples Given Below.*_\n_*(सही संदेश भेजें; उदाहरण नीचे दिए गए हैं।)*_\n👇👇🏼👇🏼👇🏿👇🏼👇🏼👇\n\n1,2,3,4=1000\n22,33,75=100\n129,300,790,447=100\nSP 1,2=100\nDP 5,6,8=100\nTP 1,5=100\nCP 80,25,11=100\nSET 123,400=100\nSP MOTOR 12345=100\nDP MOTOR 123456=100\nCSP 1,2=100\nCDP 2,6,9=100\nJDP 1,3,6=100\nJDCP 2,4=100\nABRP 100\nABRCP 200\n---------------------`,
									reaction: "🚨",
								});
								// await testPersikopQueue.add(`sendMessage`, {
								// 	group: messages.chat_id || "",
								// 	replyTo: messages.id?.id || "",
								// 	message: `😡_*Wrong Message*_😡\n❌_*(ग़लत संदेश)*_❌\n🚫❌❌❌❌❌🚫\n\n\n👇🏼🙏🙏🙏🙏🙏👇🏼\n_*Send The Correct Message; Examples Given Below.*_\n_*(सही संदेश भेजें; उदाहरण नीचे दिए गए हैं।)*_\n👇👇🏼👇🏼👇🏿👇🏼👇🏼👇\n\n1,2,3,4=1000\n22,33,75=100\n129,300,790,447=100\nSP 1,2=100\nDP 5,6,8=100\nTP 1,5=100\nCP 80,25,11=100\nSET 123,400=100\nSP MOTOR 12345=100\nDP MOTOR 123456=100\nCSP 1,2=100\nCDP 2,6,9=100\nJDP 1,3,6=100\nJDCP 2,4=100\nABRP 100\nABRCP 200\n---------------------`,
								// });
								return R("ok");
							}
						}

						if (group.type === "jodi_mix") {
							if (!groupJodiMix) {
								logger.add(`Invalid Message In Jodi Mix Group `);
								await MessageQueue.create({
									group: messages.chat_id || "",
									quotedId: messages.id?.id || "",
									text: `😡_*Wrong Message*_😡\n❌_*(ग़लत संदेश)*_❌\n🚫❌❌❌❌❌🚫\n\n\n_*👇🏼🙏🙏🙏🙏🙏👇🏼*_\n_*Send the correct message; examples given below.*_\n_*(सही संदेश भेजें; उदाहरण नीचे दिए गए हैं।)*_\n👇👇🏼👇🏼👇🏿👇🏼👇🏼👇\n\n22.48.16.70=100\nA 3=100\nB 9=100\nT 0=100\nLJ 12-30=100\nCJ 123456=100\nCDH 12359=100\nSL 100\nDL 100\nFL 100\n---------------\n`,
									reaction: "🚨",
								});
								// await testPersikopQueue.add(`sendMessage`, {
								// 	group: messages.chat_id || "",
								// 	replyTo: messages.id?.id || "",
								// 	message: `😡*Wrong Message*😡\n   ❌*(ग़लत संदेश)*❌\n🚫❌❌❌❌❌🚫\n\n\n_*(👉Jodi Mix Gali Disawar)*_\n_*Send the correct message; examples given below.*_\n_*(सही संदेश भेजें; उदाहरण नीचे दिए गए हैं।)*_\n⬇⬇⬇⬇⬇\n\n22.48.16.70=100\nA 3=100\nB 5=100\nT 9=100\n---------------\n`,
								// });
								return R("ok");
							}
						}
						const { single_jodi_pana, result_text } = parseMixBetText(
							beatType.join("\n") || "",
						);
						console.log(logPrefix, "parsed result text", result_text);

						logger.add(`Parsed Result Test:${result_text}`);
						type MixEntryParams = Parameters<
							typeof satta_entryController.mixEntry
						>;

						const adminGame = await Game.findOne({
							_id: game?._id,
							start_time: { $lte: currentTime },
							end_time: { $gte: currentTime },
						});
						console.log(
							logPrefix,
							"admin game validation result",
							adminGame?._id,
						);

						if (!adminGame) {
							console.log(logPrefix, "admin game missing, notifying group");
							const message = `💫_*Game Time Out*_💫\n_*( खेल समय समाप्त)*_\n🚫❌❌❌🚫\n🤔🤔🤔🤔🤔🤔🤔`;
							await MessageQueue.create({
								group: messages?.chat_id || "",
								text: message || "",
								quotedId: messages.id?.id || "",
								reaction: "🚨",
							});
						}
						//console.log("🚀🚀 Message Id", body.messages?.[0]?.id);
						const payload = {
							body: {
								game: game?._id || "",
								jodi: single_jodi_pana.jodi,
								pana: single_jodi_pana.pana,
								single: single_jodi_pana.single,
								source: group?.type || "",
								messageId: messages.id?.id || "",
							},
							user: admin || "",
						} as unknown as MixEntryParams["0"];

						const entryList = await satta_entryController.mixEntry(payload);
						console.log(logPrefix, "mixEntry results count", entryList?.length);
						if (!entryList || entryList.length === 0) {
							console.log(logPrefix, "no entries returned from mixEntry");
							if (group?.type == "mix") {
								await MessageQueue.create({
									group: messages.chat_id || "",
									quotedId: messages.id?.id || "",
									text: `😡_*Wrong Message*_😡\n❌_*(ग़लत संदेश)*_❌\n🚫❌❌❌❌❌🚫\n\n\n👇🏼🙏🙏🙏🙏🙏👇🏼\n_*Send The Correct Message; Examples Given Below.*_\n_*(सही संदेश भेजें; उदाहरण नीचे दिए गए हैं।)*_\n👇👇🏼👇🏼👇🏿👇🏼👇🏼👇\n\n1,2,3,4=1000\n22,33,75=100\n129,300,790,447=100\nSP 1,2=100\nDP 5,6,8=100\nTP 1,5=100\nCP 80,25,11=100\nSET 123,400=100\nSP MOTOR 12345=100\nDP MOTOR 123456=100\nCSP 1,2=100\nCDP 2,6,9=100\nJDP 1,3,6=100\nJDCP 2,4=100\nABRP 100\nABRCP 200\n---------------------`,
									reaction: "🚨",
								});
								// await testPersikopQueue.add(`sendMessage`, {
								// 	group: messages.chat_id || "",
								// 	replyTo: messages.id?.id || "",
								// 	message: `😡_*Wrong Message*_😡\n❌_*(ग़लत संदेश)*_❌\n🚫❌❌❌❌❌🚫\n\n\n👇🏼🙏🙏🙏🙏🙏👇🏼\n_*Send The Correct Message; Examples Given Below.*_\n_*(सही संदेश भेजें; उदाहरण नीचे दिए गए हैं।)*_\n👇👇🏼👇🏼👇🏿👇🏼👇🏼👇\n\n1,2,3,4=1000\n22,33,75=100\n129,300,790,447=100\nSP 1,2=100\nDP 5,6,8=100\nTP 1,5=100\nCP 80,25,11=100\nSET 123,400=100\nSP MOTOR 12345=100\nDP MOTOR 123456=100\nCSP 1,2=100\nCDP 2,6,9=100\nJDP 1,3,6=100\nJDCP 2,4=100\nABRP 100\nABRCP 200\n---------------------`,
								// });
							} else if (group?.type == "jodi_mix") {
								await MessageQueue.create({
									group: messages.chat_id || "",
									quotedId: messages.id?.id || "",
									text: `😡_*Wrong Message*_😡\n❌_*(ग़लत संदेश)*_❌\n🚫❌❌❌❌❌🚫\n\n\n_*👇🏼🙏🙏🙏🙏🙏👇🏼*_\n_*Send the correct message; examples given below.*_\n_*(सही संदेश भेजें; उदाहरण नीचे दिए गए हैं।)*_\n👇👇🏼👇🏼👇🏿👇🏼👇🏼👇\n\n22.48.16.70=100\nA 3=100\nB 9=100\nT 0=100\nLJ 12-30=100\nCJ 123456=100\nCDH 12359=100\nSL 100\nDL 100\nFL 100\n---------------\n`,
									reaction: "🚨",
								});
								// await testPersikopQueue.add(`sendMessage`, {
								// 	group: messages.chat_id || "",
								// 	replyTo: messages.id?.id || "",
								// 	message: `😡*Wrong Message*😡\n   ❌*(ग़लत संदेश)*❌\n🚫❌❌❌❌❌🚫\n\n\n_*(👉Jodi Mix Gali Disawar)*_\n_*Send the correct message; examples given below.*_\n_*(सही संदेश भेजें; उदाहरण नीचे दिए गए हैं।)*_\n⬇⬇⬇⬇⬇\n\n22.48.16.70=100\nA 3=100\nB 5=100\nT 9=100\n---------------\n`,
								// });
							}
							return R("ok");
						}

						console.log(logPrefix, "queuing success message", {
							entryCount: entryList.length,
							result_text,
						});

						await MessageQueue.create({
							group: messages?.chat_id || "",
							quotedId: messages.id?.id || "",
							text: `_*Successful*_ ✅ 
_*${moment().format("DD MMM YYYY hh:mm A")}*_
Market: _*${game?.name}*_

${result_text.join("\n")}

_*Total 💰 = ${entryList.reduce(
								(amount, perEntry) => amount + perEntry.total_amount,
								0,
							)}*_`,
							reaction: "✅",
						});
						// 						await testPersikopQueue.add(`sendMessage`, {
						// 							group: messages?.chat_id || "",
						// 							replyTo: messages.id?.id || "",
						// 							message: `_*Successful*_ ✅
						// _*${moment().format("DD MMM YYYY hh:mm A")}*_
						// Market: _*${game?.name}*_

						// ${result_text.join("\n")}

						// _*Total 💰 = ${entryList.reduce(
						// 								(amount, perEntry) => amount + perEntry.total_amount,
						// 								0,
						// 							)}*_`,
						// 						});

						console.log(logPrefix, "returning success response");

						logger.add(`Queued Message Success: Total-${entryList.length}`);
						return R("OK");
					} catch (error) {
						const logPrefix = "[periskope-webhook]";
						console.error(logPrefix, "handler error", error);

						logger.add(
							`Handler Error: ${
								(error as any)?.message
							} -- Full Error--${error}`,
						);

						if (error instanceof AppErr && (ctx.body as any)?.data?.from_me) {
							console.log(logPrefix, "AppErr encountered", error.message);
							return customError(error.message);
						}
						/* [MRQ_DISABLED] await MessageReactQueue.create({
							message_id: ((ctx.body as any)?.data as any)?.id?.id,
							reaction: "🚨",
							status: MessageReactQueueStatus.PENDING,
						}); */
						console.error(logPrefix, "queued error reaction");

						logger.add(`Queued Error Reaction `);
					} finally {
						logger.print();
					}
				},
				schema.message_received,
			)
			.post("/spinner-webhook-test", async (ctx) => {
				/**
				 * Spinner entry test webhook handler
				 * Step 1: Read incoming payload and bail early on missing/own messages.
				 * Step 2: Validate group context and ensure the Group doc has a messageId.
				 * Step 3: Validate sender as an admin and locate the active game window for this group.
				 * Step 4: Enforce entry cut-off timing and record the incoming message.
				 * Step 5: Handle deletion requests when quoting a previous message.
				 * Step 6: Parse bets with emoji amounts (respecting divided beat type).
				 * Step 7: Persist spinner entries and confirm or reject with queued replies.
				 */
				const body = ctx.body as any;

				const messages = body.data;

				// Step 1: Basic payload validation
				if (!messages) {
					return customError("InValid Message Payload");
				}

				if (messages?.from_me) {
					return customError("Own Message Ignored");
				}

				const groupId = messages.chat_id;

				// Step 2: Validate group id format and hydrate group data/messageId
				if (!groupId.includes("@g.us") && !messages.is_group) {
					return customError("InValid Group Id");
				}

				let group = await Group.findOne({ groupId: groupId });

				if (!group?.messageId) {
					group = await Group.findByIdAndUpdate(
						group?._id,
						{
							$set: { messageId: messages.id?.id },
						},
						{ new: true },
					);
				}

				if (!group) {
					return customError("Group Not Found");
				}

				if (messages?.message_type !== "chat" || !messages.body) {
					return customError("Send Valid Text");
				}

				const phone = messages.sender_phone
					?.replace("@c.us", "")
					.replace(/^91/, "");

				// Step 3: Verify sender as an admin; queue failure response if unknown
				if (!phone) {
					return customError("Provide Valid Number");
				}

				const admin = await Admin.findOne({ phone: phone });
				if (!admin) {
					await MessageQueue.create({
						group: messages.chat_id,
						quotedId: messages.id?.id,
						text: "Provided Number Not Found In Members",
						reaction: "🚨",
					});

					return customError("Provided Number Not Found In Members");
				}

				// Step 3: Resolve group game times and ensure chat message shape
				const groupGameTime = await GroupGameTime.find({ group: group._id });

				// const game = await Game.findOne({ _id: { $in: group.gameId } });

				// console.log("Game", game);
				const currentTime = moment().diff(moment().startOf("day"), "minutes");
				console.log("Current Time", currentTime);
				// Step 3: Identify current game slot for this group
				const gameTime = await GameTime.findOne({
					start: { $lte: currentTime },
					end: { $gte: currentTime },
					_id: { $in: groupGameTime.map((g) => g.game_time) },
				}).populate("game");

				console.log("Game time", gameTime);

				if (!gameTime) {
					await MessageQueue.create({
						group: messages.chat_id,
						quotedId: messages.id?.id,
						text: `💫_*Game Time Out*_💫\n_*( खेल समय समाप्त)*_\n🚫❌❌❌🚫\n🤔🤔🤔🤔🤔🤔🤔`,
						reaction: "🚨",
					});
					return customError("Game Not Found On This Time");
				}

				const reminder1 = gameTime?.end - gameTime?.entry_margin;
				console.log("Current Time", currentTime);
				// console.log("Reminder ", reminder1);

				// Step 4: Enforce entry margin cut-off
				const entryCutoffTime = gameTime.entry_margin;

				if (currentTime >= entryCutoffTime) {
					await MessageQueue.create({
						group: messages.chat_id,
						quotedId: messages.id?.id,
						text: `💫_*Game Time Out*_💫\n_*( खेल समय समाप्त)*_`,
						reaction: "🚨",
					});

					return customError("Game Time Out");
				}

				/* [MRQ_DISABLED] await MessageReactQueue.create({
					message_id: messages.id?.id,
					reaction: "✍",
					status: MessageReactQueueStatus.PENDING,
				}); */
				const createdMessage = await Message.create({
					text: messages.body,
					messageId: messages.id?.id,
					group: group._id,
					user: admin._id,
					status: messageStatus.Pending,
				});

				// Step 5: Normalize message lines and support delete commands
				const betType = (messages.body as string)
					.split("\n")
					.map((b: string) =>
						b
							.replace(/\s*=\s*/g, "=")
							.replace(/\s+/g, " ")
							.trim(),
					)
					.filter((b: string) => b.length > 0);
				console.log("Beat Type", betType);

				const deleteType = ["delete", "cancel", "❌", "✖"];
				if (
					deleteType.some((d) => messages.body.toLowerCase().includes(d)) &&
					messages.quoted_message_id
				) {
					const entry = await NumberEntryTransection.findOne({
						messageId: messages.quoted_message_id,
					});

					if (!entry) {
						return R("NO ENTRY FOUND");
					}

					if (entry.deleted) {
						return R("Entry deleted");
					}

					const session = await mongoose.startSession();
					session.startTransaction();
					try {
						for (let number in entry?.numbers_map) {
							await NumbersEntry.updateMany(
								{
									admin: entry.admin,
									game: entry.game,
									game_time: entry.game_time,
									number: new Types.ObjectId(number),
									// date: entry.date,
								},
								{
									$inc: {
										amount: -(entry?.numbers_map[number] || 0),
										total_amount: -(entry?.numbers_map[number] || 0),
									},
								},
								{ session },
							);
						}

						entry.deleted = true;
						await entry.save({ session });

						await reverseWalletUsage({
							adminId: entry.admin.toString(),
							amount: entry.amount || entry.total_amount || 0,
							refType: "NumberEntryTransection",
							refId: entry._id,
							meta: {
								source: entry.source,
								game: entry.game,
								game_time: entry.game_time,
							},
							createdBy: admin._id.toString(),
							session,
						});

						await session.commitTransaction();
					} catch (err) {
						await session.abortTransaction();
						throw err;
					} finally {
						session.endSession();
					}

					await MessageQueue.create({
						group: messages.chat_id,
						quotedId: messages.id?.id,
						text: `OK ${messages.body}`,
						reaction: "❌",
					});

					return R("Entry deleted");
				}

				// Step 6: Parse numbers and amounts, respecting divided beat rule
				const supportiveEmojiIndex = await getSupportiveEmojiIndex(
					gameTime?.game?._id.toString(),
				);

				const data: ReturnType<typeof parseEmojiAmounts> = {
					numbers: [],
					numbers_map: {},
					text: "",
					total_amount: 0,
				};

				if (group.beat_type === GroupBeatTypeEnum.DIVIDED) {
					for (let bet of betType) {
						/** START */
						let { numbers, numbers_map, text, total_amount } =
							parseEmojiAmounts(bet || "", supportiveEmojiIndex);

						let count = numbers.length;

						if (count > 0) {
							total_amount = Math.min(...Object.values(numbers_map));

							const perAmount = Math.floor(total_amount / count);

							const newMap = {} as Record<string, any>;

							for (let key of numbers) {
								if (!newMap[key]) {
									newMap[key] = 0;
								}

								newMap[key] += perAmount;
							}

							numbers_map = newMap;

							total_amount = perAmount * count;
						}
						/** START */

						/** MAIN LOGIC */
						data.numbers.push(...numbers);

						for (let key in numbers_map) {
							if (data.numbers_map?.[key]) {
								data.numbers_map[key] += numbers_map[key];
							} else {
								data.numbers_map[key] = numbers_map[key];
							}
						}
						data.text += text + "\n";
						data.total_amount += total_amount;
						/** MAIN LOGIC */
					}
				} else if (group.beat_type === GroupBeatTypeEnum.MULTIPLYER) {
					let { numbers, numbers_map, text, total_amount } = parseEmojiAmounts(
						betType.join("\n") || "",
						supportiveEmojiIndex,
					);
					data.numbers.push(...numbers);
					data.numbers_map = numbers_map;
					data.text = text;
					data.total_amount = total_amount;
				}

				const { entryList, validMap } = await numbersEntryController.spinner({
					body: {
						game: gameTime?._id.toString(),
						numbers: data.numbers,
						numbers_map: data.numbers_map,
						source: "default",
						text: data.text,
						total_amount: data.total_amount,
						messageId: messages.id?.id,
					},
					user: admin || "",
				});

				// Step 7: Confirm parsed entries and queue success/error responses
				if (
					!entryList ||
					(entryList.modifiedCount === 0 && entryList.upsertedCount === 0)
				) {
					await MessageQueue.create({
						group: messages.chat_id || "",
						quotedId: messages.id?.id || "",
						text: `😡_*Wrong Message*_😡\n❌_*(ग़लत संदेश)*_❌\n🚫❌❌❌❌❌🚫\n\n\n_*👇🏼🙏🙏🙏🙏🙏👇🏼*_\n_*Send the correct message; examples given below.*_\n_*(सही संदेश भेजें; उदाहरण नीचे दिए गए हैं।)*_\n👇👇🏼👇🏼👇🏿👇🏼👇🏼👇\n\n🌹.☂️.🌞.🪁=100\n⚽.🦋.🪣=200\nB 9=100\n🐄.🦣=300\n☎️=400\n\n---------------\n`,
						reaction: "🚨",
					});
					return R("ok");
				}
				const numbersMapText = Object.keys(data.numbers_map)
					.map((n) => (validMap[n] ? `${n} = ${validMap[n]}` : `${n} = ❌`))
					.join("\n");

				await MessageQueue.create({
					group: messages?.chat_id || "",
					quotedId: messages.id?.id || "",
					text: `_*Successful*_ ✅ 
_*${moment().format("DD MMM YYYY hh:mm A")}*_
Market: _*${(gameTime?.game as any)?.name} ${minuteToTimeRange(gameTime?.end)}*_

${numbersMapText}

_*Total 💰 = ${Object.entries(validMap).reduce(
						(sum, [_, amount]) => sum + (amount as any),
						0,
					)}*_`,
					reaction: "✅",
				});
				return R("OK");
			})
			.get(
				"/webhook-log",
				async (ctx) => {
					try {
						console.info(!fs.existsSync(logFilePath));
						if (!fs.existsSync(logFilePath)) {
							return customError("Log File Not Found");
						}

						const stream = fs.createReadStream(logFilePath, {
							encoding: "utf-8",
						});
						let data = "";

						for await (const chunk of stream) {
							data += chunk;
						}

						const logs = data
							.split(/=+\n/g)
							.map((entry) => entry.trim())
							.filter((entry) => entry.length > 0);
						return R("logs List", logs);
					} catch (error: any) {
						console.error("Error In Reading", error);
						return customError("Failed To Read File");
					}
				},
				schema.log_list,
			),
);
