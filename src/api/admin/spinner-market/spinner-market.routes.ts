import { R } from "src/utils/response-helpers";
import schema, { name } from "./spinner-market.schema";
import GameCategory, { GameCategoryClass } from "src/models/GameCategory";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import mongoose, { RootFilterQuery, Types } from "mongoose";
import { buildScopedQuery } from "src/utils/access-grants";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { ModuleId, Summary } from "src/config/modules";
import SpinnerMarket from "src/models/SpinnerMarket";
import moment from "moment";
import GameNumber from "src/models/GameNumber";
import Numbers, { Status } from "src/models/Numbers";
import NumbersEntry from "src/models/NumbersEntry";
import NumberEntryTransection from "src/models/NumberEntryTransection";
import crypto from "crypto";
import parseEmojiAmounts from "src/utils/common";
import GameTime from "src/models/GameTime";
import {
	logWalletTransaction,
	reserveWalletUsage,
	reverseWalletUsage,
} from "src/utils/wallet";
import { WalletTransactionType } from "src/models/WalletTransaction";

export default createElysia({ prefix: "/spinner-market" }).guard(
  {
    detail: {
      tags: ["SpinnerMarket"],
      summary: Summary([ModuleId.SPINNER_MARKET]),
    },
    beforeHandle: isAdminAuthenticated,
  },
  (app) =>
    app
      .post(
        "/add-market",
        async ({ body, user }) => {
          const today = moment().startOf("day");
          const currentTime = moment().diff(moment().startOf("day"), "minutes");

          // console.log("Body", body);

          const parsedNumberEntryBody = parseEmojiAmounts(body.text);

          // ⏱️ GameTime validation
          const gameTime = await GameTime.findById(body.game_time);
          if (!gameTime) return customError("Invalid Game");

          const entryCutoffTime = gameTime.entry_margin;
          // console.log("🚀 entry cutOff", entryCutoffTime);
          // console.log("🚀  Current Time", currentTime);

          if (currentTime < gameTime.start) {
            return customError("Selected Game Not Started Yet");
          }

          if (currentTime >= entryCutoffTime)
            return customError("Selected Game Ended");

          // 🎯 Allowed numbers
          const gameNumbers = await GameNumber.find({
            game: gameTime.game,
          }).populate("number", "text");

          const permittedNumbers = gameNumbers.map((g: any) => g.number.text);

          const uniqueNumbers = [
            ...new Set(parsedNumberEntryBody.numbers),
          ].filter((n) => permittedNumbers.includes(n));

          const validNumbers = await Numbers.find({
            text: { $in: uniqueNumbers },
            status: Status.ACTIVE,
          });

          if (!validNumbers.length) {
            return customError("No valid numbers found");
          }

          const numberIdsMap: Record<string, any> = {};
          const validMap: Record<string, number> = {};
          const validIdMap: Record<string, number> = {};

          for (let n of validNumbers) {
            numberIdsMap[n.text] = n._id;
            validMap[n.text] = parsedNumberEntryBody.numbers_map[n.text];
            validIdMap[n._id.toString()] =
              parsedNumberEntryBody.numbers_map[n.text];
          }

          const bulkList = Object.entries(validMap).map(([num, amount]) => ({
            updateMany: {
              filter: {
                admin: user._id,
                game: gameTime.game,
                game_time: gameTime._id,
                number: numberIdsMap[num],
                date: today,
                market: true,
              },
              update: {
                $inc: {
                  amount: amount,
                  total_amount: amount,
                },
                $setOnInsert: {
                  source: body.source || "market",
                },
              },
              upsert: true,
            },
          }));

          const totalAmount = Object.values(validMap).reduce((a, b) => a + b, 0);
          if (totalAmount <= 0) return customError("Invalid amount");

          const session = await mongoose.startSession();
          session.startTransaction();
          try {
            const { wallet } = await reserveWalletUsage({
              adminId: user._id.toString(),
              amount: totalAmount,
              session,
              meta: {
                source: body.source || "market",
                game: gameTime.game,
                game_time: gameTime._id,
                market: true,
              },
            });

            const entryList = await NumbersEntry.bulkWrite(bulkList, { session });

            const [transection] = await NumberEntryTransection.create(
              [
                {
                  admin: user._id,
                  game: gameTime.game,
                  game_time: gameTime._id,
                  numbers: Object.values(numberIdsMap),
                  numbers_map: validIdMap,
                  date: today,
                  amount: totalAmount,
                  total_amount: totalAmount,
                  source: body.source || "market",
                  market: true,
                  text: body.text,
                },
              ],
              { session },
            );

            const token = crypto.randomBytes(5).toString("hex");
            console.log("🚀 ~ token:", token);

            await SpinnerMarket.create(
              [
                {
                  admin: user._id,
                  game_time: gameTime._id,
                  date: today,
                  client_name: body.client_name,
                  source: body.source || "market",
                  token: token,
                  transection: transection._id,
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
                source: body.source || "market",
                game: gameTime.game,
                game_time: gameTime._id,
                market: true,
              },
              createdBy: user._id.toString(),
              session,
            });

            await session.commitTransaction();
            return R("Market entry added successfully", entryList);
          } catch (err) {
            await session.abortTransaction();
            throw err;
          } finally {
            session.endSession();
          }
        },
        schema.add_market,
      )
      .get(
        "/market-list",
        async ({ query, user }) => {
          const game_time = query.gameTime;
          const today = moment().startOf("day");
          const startDate = query.dateFrom || today.startOf("day").toDate();
          const endDate = query.dateTo || today.endOf("day").toDate();

          const list = await SpinnerMarket.find({
            game_time: game_time,
            // date: today,
            date: {
              $gte: startDate,
              $lt: endDate,
            },
            admin: user._id.toString(),
            deleted: false,
          })
            .populate({
              path: "transection",
              populate: { path: "numbers" },
            })
            .populate({
              path: "game_time",
              populate: "game",
            })
            .sort({ createdAt: -1 })
            .lean();

          return R("Market list", list);
        },
        schema.list_market,
      )
      .delete(
        "/",
        async ({ query, user }) => {
          const currentTime = moment().diff(moment().startOf("day"), "minutes");

          const entry = await SpinnerMarket.findById(query?.id);

          if (!entry) {
            return customError("Market Entry Not Found");
          }

          const game_time = await GameTime.findById(entry.game_time);

          if (!game_time) {
            return customError("Game not found");
          }

          const entryCutoffTime = game_time.entry_margin;

          if (currentTime >= entryCutoffTime) {
            return customError("Cannot Delete Market After Game Time Out ");
          }

          const transection = await NumberEntryTransection.findById(
            entry.transection,
          );

          if (!transection) {
            return customError("entry not found");
          }

          if (transection.deleted) {
            entry.deleted = true;
            await entry.save();
            return R("Market Delete", entry);
          }

          const session = await mongoose.startSession();
          session.startTransaction();
          try {
            for (let number in transection?.numbers_map) {
              await NumbersEntry.updateMany(
                {
                  admin: entry.admin,
                  game: transection.game,
                  game_time: entry.game_time,
                  number: new Types.ObjectId(number),
                  // date: entry.date,
                },
                {
                  $inc: {
                    amount: -(transection?.numbers_map[number] || 0),
                    total_amount: -(transection?.numbers_map[number] || 0),
                  },
                },
                { session },
              );
            }

            transection.deleted = true;
            await transection.save({ session });

            entry.deleted = true;
            await entry.save({ session });

            await reverseWalletUsage({
              adminId: entry.admin.toString(),
              amount: transection.amount || transection.total_amount || 0,
              refType: "NumberEntryTransection",
              refId: transection._id,
              meta: {
                source: transection.source,
                game: transection.game,
                game_time: transection.game_time,
                market: true,
              },
              createdBy: user._id.toString(),
              session,
            });

            await session.commitTransaction();
            return R("Market Delete", entry);
          } catch (err) {
            await session.abortTransaction();
            throw err;
          } finally {
            session.endSession();
          }
        },
        schema.delete,
      )
      .post(
        "/payment-complete",
        async ({ query }) => {
          const entry = await SpinnerMarket.findByIdAndUpdate(query.id, {
            payment_completed: true,
          });

          return R("Payment Completed");
        },
        schema.payment_complete,
      ),
);
