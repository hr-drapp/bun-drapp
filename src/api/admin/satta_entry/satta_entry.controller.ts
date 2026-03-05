import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import rolesSchema from "./satta_entry.schema";
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

export default {
	mixEntry: async ({
		body,
		user,
	}: {
		body: {
			single?:
				| {
						numbers_map?: any;
						category: string;
						text: string;
						amount: number;
						total_amount: number;
						numbers: number[];
				  }[]
				| undefined;
			jodi?:
				| {
						numbers_map?: any;
						category: string;
						text: string;
						amount: number;
						total_amount: number;
						numbers: number[];
				  }[]
				| undefined;
			pana?:
				| {
						numbers_map?: any;
						category: string;
						text: string;
						amount: number;
						total_amount: number;
						numbers: number[];
				  }[]
				| undefined;
			source?: string;
			game: string;
			messageId?: any;
		};
		user: any;
	}) => {
		const today = moment().startOf("day");
		const source = body.source;
		const messageId = body.messageId;

		const game = await Game.findById(body.game);

		if (!game) {
			return customError("Invalid Game");
		}

		if (game.time_range.length) {
			const currentDateTime = moment();

			const currentTime = moment().diff(moment().startOf("day"), "minutes");

			// const currentTime = parseFloat(
			// 	`${currentDateTime.hours()}.${currentDateTime.minutes()}`,
			// );

			// const startTime = parseFloat(
			// 	`${game.time_range[0][0]}.${game.time_range[0][1]}`,
			// );
			// const endTime = parseFloat(
			// 	`${game.time_range[1][0]}.${game.time_range[1][1]}`,
			// );

			const remainder = game.end_time - game.start_time;

			const remainder1 = currentTime - game.start_time;
			const remainder2 = game.end_time - currentTime;

			if (remainder1 < 0) {
				return customError("Game has not started yet.");
			}

			if (remainder2 > remainder) {
				return customError("Game ended.");
			}
		}

		const sattaEntryList = [];
		const SattaNumberEntryList = [] as any[];

		if (body.single?.length) {
			for (let item of body.single) {
				sattaEntryList.push({
					...item,
					date: today,
					admin: user._id,
					category: item.category,
					game: game._id,
					source: source || "default",
					messageId: messageId || "",
				});

				let listEntries = item.numbers.map((_item) => {
					return {
						updateMany: {
							filter: {
								admin: user._id,
								category: item.category,
								number: _item,
								game: game._id,
								date: today,
								source: source || "default",
							},
							// If you were using the MongoDB driver directly, you'd need to do
							// `update: { $set: { title: ... } }` but mongoose adds $set for
							// you.
							update: {
								$inc: {
									amount: item?.numbers_map?.[_item] || item.amount,
								},
							},
							upsert: true,
						},
					};
				});
				SattaNumberEntryList.push(...listEntries);
			}
		}

		if (body.jodi?.length) {
			for (let item of body.jodi) {
				sattaEntryList.push({
					...item,
					date: today,
					admin: user._id,
					game: game._id,
					category: item.category,
					source: source || "default",
					messageId: messageId || "",
				});

				let listEntries = item.numbers.map((_item) => {
					return {
						updateMany: {
							filter: {
								admin: user._id,
								category: item.category,
								number: _item,
								game: game._id,
								date: today,
								source: source || "default",
							},
							// If you were using the MongoDB driver directly, you'd need to do
							// `update: { $set: { title: ... } }` but mongoose adds $set for
							// you.
							update: {
								$inc: {
									amount: item?.numbers_map?.[_item] || item.amount,
								},
							},
							upsert: true,
						},
					};
				});
				SattaNumberEntryList.push(...listEntries);
			}
		}

		if (body.pana?.length) {
			for (let item of body.pana) {
				sattaEntryList.push({
					...item,
					date: today,
					admin: user._id,
					game: game._id,
					category: item.category,
					source: source || "default",
					messageId: messageId || "",
				});

				let listEntries = item.numbers.map((_item) => {
					return {
						updateMany: {
							filter: {
								admin: user._id,
								category: item.category,
								number: _item,
								game: game._id,
								date: today,
								source: source || "default",
							},
							// If you were using the MongoDB driver directly, you'd need to do
							// `update: { $set: { title: ... } }` but mongoose adds $set for
							// you.
							update: {
								$inc: {
									amount: item?.numbers_map?.[_item] || item.amount,
								},
							},
							upsert: true,
						},
					};
				});
				SattaNumberEntryList.push(...listEntries);
			}
		}

		const entryList = await SattaEntry.insertMany(sattaEntryList);

		const list = await SattaNumberEntry.bulkWrite(SattaNumberEntryList);
		return entryList;
	},
};
