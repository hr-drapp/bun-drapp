import moment from "moment";
import mongoose, { Types } from "mongoose";
import GameNumber from "src/models/GameNumber";
import GameTime from "src/models/GameTime";
import NumberEntryTransection from "src/models/NumberEntryTransection";
import Numbers, { Status } from "src/models/Numbers";
import NumbersEntry, { NumberEntryClass } from "src/models/NumbersEntry";
import { customError } from "src/utils/AppErr";
import {
	logWalletTransaction,
	reserveWalletUsage,
} from "src/utils/wallet";
import { WalletTransactionType } from "src/models/WalletTransaction";

export default {
	spinner: async ({
		body,
		user,
	}: {
		body: {
			numbers_map?: any;
			text: string;
			total_amount: number;
			numbers: string[];

			source?: string;
			game: string;
			messageId?: string;
		};
		user: any;
	}) => {
		const today = moment().startOf("day");
		const currentTime = moment().diff(moment().startOf("day"), "minutes");
		// console.log("Current Time", currentTime);

		console.log("Body", body);
		const gameTime = await GameTime?.findOne({ _id: body?.game });
		console.log("GameTime", gameTime);
		if (!gameTime) {
			return customError("InValid Game");
		}

		let remainder = gameTime?.end - gameTime?.start;
		// console.log("Remaindr", remainder);
		const remainder1 = currentTime - gameTime?.start;
		// console.log("Remaindr1", remainder1);
		const remainder2 = gameTime?.end - currentTime;
		// console.log("Remaindr2", remainder2);

		if (remainder1 < 0) {
			return customError("Selected Game Not Started Yet");
		}

		if (remainder2 > remainder) {
			return customError("Selected Game Ended");
		}

		const gameNumbers = await GameNumber.find({
			game: gameTime?.game,
		}).populate("number", "text");

		const gamePermittedNumber = gameNumbers.map((g: any) => g.number?.text);

		const allNumbers = [...new Set(body?.numbers)].filter((n) =>
			gamePermittedNumber.includes(n),
		);

		const validNumbers = await Numbers.find({
			text: { $in: allNumbers },
			status: Status.ACTIVE,
		});
		// console.log("🚀 ~ validNumbers:", validNumbers);

		// numberIds map
		const numberIdsMap: Record<string, string | Types.ObjectId> = {};
		const validMap: Record<string, number> = {};
		const validIdMap: Record<string, number> = {};

		let transectionEntryList = [];

		for (let n of validNumbers) {
			numberIdsMap[n.text] = n?._id;

			validMap[n.text] = body.numbers_map[n.text];
			validIdMap[n._id.toString()] = body.numbers_map[n.text];
		}

		transectionEntryList.push({
			admin: user._id,
			game: gameTime.game,
			game_time: gameTime._id,
			date: today,
			total_amount: body.total_amount,
			source: body.source || "default",
			messageId: body.messageId || null,
		});

		let listEntries = Object.entries(validMap).map(([emoji, amount]) => {
			return {
				updateMany: {
					filter: {
						admin: user._id,
						game: gameTime.game,
						game_time: gameTime._id,
						number: numberIdsMap[emoji],
						date: today,
					},
					update: {
						$inc: {
							amount: amount, // ✅ exact amount
							total_amount: amount, // ✅ per emoji
						},
						$setOnInsert: {
							source: body.source || "default",
							messageId: body.messageId || null,
						},
					},
					upsert: true,
				},
			};
		});

		const totalAmount = Object.values(validMap).reduce((a, b) => a + b, 0);
		if (totalAmount <= 0) {
			return customError("Invalid amount");
		}

		const session = await mongoose.startSession();
		session.startTransaction();
		try {
			if (body.messageId) {
				const existing = await NumberEntryTransection.findOne({
					messageId: body.messageId,
					deleted: false,
				}).session(session);
				if (existing) {
					await session.commitTransaction();
					return {
						entryList: { modifiedCount: 1, upsertedCount: 0 },
						validMap,
					};
				}
			}

			const { wallet } = await reserveWalletUsage({
				adminId: user._id.toString(),
				amount: totalAmount,
				session,
				meta: {
					source: body.source || "default",
					game: gameTime.game,
					game_time: gameTime._id,
					messageId: body.messageId,
				},
			});

			const entryList = await NumbersEntry.bulkWrite(listEntries, { session });

			const [transection] = await NumberEntryTransection.create(
				[
					{
						admin: user._id,
						game: gameTime.game,
						game_time: gameTime._id,
						numbers: Object.values(numberIdsMap),
						numbers_map: validIdMap,
						date: moment().toDate(),
						amount: totalAmount,
						messageId: body.messageId,
						source: body.source || "default",
						total_amount: totalAmount,
						text: body.text,
					},
				],
				{ session },
			);

			await logWalletTransaction({
				walletId: wallet._id.toString(),
				adminId: user._id.toString(),
				type: WalletTransactionType.DEBIT,
				amount: totalAmount,
				refType: "NumberEntryTransection",
				refId: transection._id,
				meta: {
					source: body.source || "default",
					game: gameTime.game,
					game_time: gameTime._id,
					messageId: body.messageId,
				},
				createdBy: user._id.toString(),
				session,
			});

			await session.commitTransaction();
			return {
				entryList,
				validMap,
			};
		} catch (err) {
			await session.abortTransaction();
			throw err;
		} finally {
			session.endSession();
		}
	},
};
