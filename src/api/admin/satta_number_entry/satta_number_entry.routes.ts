import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import rolesSchema from "./satta_number_entry.schema";
import Admin from "src/models/drapp/Admin";
import SattaNumberEntry from "src/models/SattaNumberEntry";
import { createElysia } from "src/utils/createElysia";
import moment from "moment";
import { AnkCategory, anks } from "src/utils/anks";

export default createElysia({ prefix: "/satta_number_entry" }).guard(
	{
		detail: {
			tags: ["Satta Number Entry"],
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
					const today = moment().startOf("day").toDate();
					const endToday = moment().endOf("day").toDate();
					const source = query.source || "default";

					console.log("~~ 🚀🚀 Query Game ", game);

					const filter = {
						category: parseFloat(category),
						date: {
							$gte: today,
							$lte: endToday,
						},
						game: game,
						admin: user._id.toString(),
						market: false,
						...(source && {
							source: source,
						}),
					};

					// console.log(`filter: `, filter);

					let list = await SattaNumberEntry.find(filter).sort({
						number: "asc",
					});
					// console.log("🚀 ~ list ~ list:", list)
					console.log("🚀 ~ list ~ list.length:", list.length);
					console.log(
						"🚀 ~ list ~ anks[AnkCategory.SINGLE].length:",
						anks[AnkCategory.SINGLE].length,
					);

					//
					if (
						category == AnkCategory.SINGLE &&
						list.length < anks[AnkCategory.SINGLE].length
					) {
						const existingNumber = list.map((item) => item.number);
						const amount = list.reduce((acc, entry) => {
							acc[entry.number] = Number(entry.amount);
							return acc;
						}, {} as any);
						console.log("🚀🚀 Amount", amount);
						const toBeCreate = [];

						for (let number of anks[AnkCategory.SINGLE]) {
							if (!existingNumber.includes(number)) {
								toBeCreate.push({
									admin: user._id,
									amount: amount[number] || 0,
									category: AnkCategory.SINGLE,
									date: today,
									number: number,
									game: game,
									...(source && {
										source: source,
									}),
								});
							}
						}

						let remainingList = await SattaNumberEntry.create(toBeCreate);
						list = [...list, ...remainingList].sort(
							(a, b) => a.number - b.number,
						);
					} else if (
						category == AnkCategory.PANA &&
						list.length < anks[AnkCategory.PANA].length
					) {
						const existingNumber = list.map((item) => item.number);
						const amount = list.reduce((acc, entry) => {
							acc[entry.number] = Number(entry.amount);
							return acc;
						}, {} as any);
						console.log("🚀🚀 Amount", amount);
						const toBeCreate = [];

						for (let number of anks[AnkCategory.PANA]) {
							if (!existingNumber.includes(number)) {
								toBeCreate.push({
									admin: user._id,
									amount: amount[number] || 0,
									category: AnkCategory.PANA,
									date: today,
									number: number,
									game: game,
									...(source && {
										source: source,
									}),
								});
							}
						}

						let remainingList = await SattaNumberEntry.create(toBeCreate);
						list = [...list, ...remainingList].sort(
							(a, b) => a.number - b.number,
						);
					} else if (
						category == AnkCategory.JODI &&
						list.length < anks[AnkCategory.JODI].length
					) {
						const existingNumber = list.map((item) => item.number);
						const amount = list.reduce((acc, entry) => {
							acc[entry.number] = Number(entry.amount);
							return acc;
						}, {} as any);
						console.log("🚀🚀 Amount", amount);
						const toBeCreate = [];

						for (let number of anks[AnkCategory.JODI]) {
							if (!existingNumber.includes(number)) {
								toBeCreate.push({
									admin: user._id,
									amount: amount[number] || 0,
									category: AnkCategory.JODI,
									date: today,
									number: number,
									game: game,
									...(source && {
										source: source,
									}),
								});
							}
						}

						let remainingList = await SattaNumberEntry.create(toBeCreate);
						list = [...list, ...remainingList].sort(
							(a, b) => a.number - b.number,
						);
					} else if (
						[AnkCategory.ANDAR, AnkCategory.BAHAR, AnkCategory.TOTAL].includes(
							category,
						) &&
						list.length < anks[category].length
					) {
						const existingNumber = list.map((item) => item.number);
						const amount = list.reduce((acc, entry) => {
							acc[entry.number] = Number(entry.amount);
							return acc;
						}, {} as any);
						console.log("🚀🚀 Amount", amount);
						const toBeCreate = [];

						for (let number of anks[category]) {
							if (!existingNumber.includes(number)) {
								toBeCreate.push({
									admin: user._id,
									amount: amount[number] || 0,
									category: category,
									date: today,
									number: number,
									game: game,
									...(source && {
										source: source,
									}),
								});
							}
						}

						let remainingList = await SattaNumberEntry.create(toBeCreate);
						list = [...list, ...remainingList].sort(
							(a, b) => a.number - b.number,
						);
					}

					if (category == AnkCategory.SINGLE) {
						list = list.sort(
							(a, b) =>
								(a.number || Number.MAX_VALUE) - (b.number || Number.MAX_VALUE),
						);
					}

					if (
						category == AnkCategory.PANA ||
						category == AnkCategory.JODI ||
						[AnkCategory.ANDAR, AnkCategory.BAHAR, AnkCategory.TOTAL].includes(
							category,
						)
					) {
						const firstElement = list.shift(); // Remove the first element from the array.

						if (firstElement !== undefined) {
							list.push(firstElement); // Add the first element to the end of the array.
						}
					}

					console.log("🚀 List after rearranging first element:", list.length);

					return R("entry numbers list data", list, true, {});
				},
				rolesSchema.list,
			)
			.post(
				"/",
				async ({ body }) => {
					// const entry = await SattaNumberEntry.create(body);
					console.log("🚀 ~~ Body");
					return R("entry updated");
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
					const entry = await SattaNumberEntry.findByIdAndDelete(query.id);

					return R("entry updated", entry);
				},
				rolesSchema.delete,
			),
);
