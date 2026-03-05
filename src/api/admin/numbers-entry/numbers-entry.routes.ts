import { isAdminAuthenticated } from "src/guard/auth.guard";
import { R } from "src/utils/response-helpers";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import NumbersEntry from "src/models/NumbersEntry";
import schema from "./numbers-entry.schema";
import Game from "src/models/Game";
import Numbers, { Status } from "src/models/Numbers";
import numbers_entryController from "./numbers-entry.controller";
import moment from "moment";
import GameTime from "src/models/GameTime";
import { ModuleId, Summary } from "src/config/modules";
import parseEmojiAmounts from "src/utils/common";
import GameNumber from "src/models/GameNumber";
import SpinnerMarket from "src/models/SpinnerMarket";
import NumberEntryTransection from "src/models/NumberEntryTransection";

import mongoose, { Types } from "mongoose";
import {
	logWalletTransaction,
	reserveWalletUsage,
	reverseWalletUsage,
} from "src/utils/wallet";
import { WalletTransactionType } from "src/models/WalletTransaction";

export default createElysia({ prefix: "/numbers-entry" }).guard(
  {
    detail: {
      tags: ["NumbersEnrty"],
      summary: Summary([ModuleId.CHART]),
    },
    beforeHandle: isAdminAuthenticated,
  },
  (app) =>
    app
      .get(
        "/",
        async ({ query, user }) => {
          const game_time = query.gameTime;
          const today = moment().startOf("day");
          console.log("Game", game_time);
          console.log("Admin", user?._id);
          const entryList = await NumbersEntry.find({
            game_time: game_time,
            admin: user?._id,
            date: today,
            source: query.source || "default",
            amount: { $gt: 0 },
          })
            .populate("admin")
            .populate("number");
          // .populate("game");
          //   console.log("Entry List", entryList);
          return R("Number EntryList", entryList);
        },
        schema.list,
      )
      .post(
        "/",
        async ({ body, user }) => {
          const parsedNumberEntryBody = parseEmojiAmounts(body.text);

          console.log("Parse,", parsedNumberEntryBody);

          if (
            !parsedNumberEntryBody ||
            Object.keys(parsedNumberEntryBody).length === 0
          ) {
            return customError("Invalid Text Please send Valid Text");
          }

          const today = moment().startOf("day");
          const currentTime = moment().diff(moment().startOf("day"), "minutes");

          const gameTime = await GameTime?.findOne({ _id: body?.game_time });
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

          const allNumbers = [...new Set(parsedNumberEntryBody?.numbers)];
          const validNumbers = await Numbers.find({
            text: { $in: allNumbers },
            status: Status.ACTIVE,
          });
          console.log("🚀 ~ validNumbers:", validNumbers);

          // numberIds map
          const numberIdsMap: any = {};
          const validMap: Record<string, number> = {};
          const validIdMap: Record<string, number> = {};

          for (let n of validNumbers) {
            numberIdsMap[n.text] = n?._id;

            validMap[n.text] = parsedNumberEntryBody.numbers_map[n.text];
            validIdMap[n._id.toString()] =
              parsedNumberEntryBody.numbers_map[n.text];
          }

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
            const { wallet } = await reserveWalletUsage({
              adminId: user._id.toString(),
              amount: totalAmount,
              session,
              meta: {
                source: body.source || "default",
                game: gameTime.game,
                game_time: gameTime._id,
              },
            });

            const entryList = await NumbersEntry.bulkWrite(listEntries, {
              session,
            });

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
              },
              createdBy: user._id.toString(),
              session,
            });

            await session.commitTransaction();
            return R("Number Entry Created", entryList);
          } catch (err) {
            await session.abortTransaction();
            throw err;
          } finally {
            session.endSession();
          }
        },
        schema.create,
      )
      .put(
        "/",
        async (ctx) => {
          const id = ctx.query.id;
          const entry = await NumbersEntry.findByIdAndUpdate(id, ctx.body);
          return R("Number Updated");
        },
        schema.update,
      )
      .delete(
        "/",
        async ({ query, user }) => {
          const entry = await NumberEntryTransection.findOne({
            _id: query.id,
          });
          console.log("ENtry", entry);
          if (!entry) {
            return R("NO ENTRY FOUND");
          }

          if (entry.deleted) {
            return R("Number Deleted", entry);
          }

          const session = await mongoose.startSession();
          session.startTransaction();
          try {
            for (let number in entry?.numbers_map) {
              console.log("Number", number);
              const res = await NumbersEntry.updateMany(
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
              console.log("UPDATED:", res.modifiedCount);
            }

            entry.deleted = true;
            await entry.save({ session });

            await reverseWalletUsage({
              adminId: entry.admin.toString(),
              amount: entry.amount || entry.total_amount || 0,
              refType: "NumberEntryTransection",
              refId: entry._id,
              meta: { source: entry.source, game: entry.game, game_time: entry.game_time },
              createdBy: user._id.toString(),
              session,
            });

            await session.commitTransaction();
            return R("Number Deleted", entry);
          } catch (err) {
            await session.abortTransaction();
            throw err;
          } finally {
            session.endSession();
          }
        },
        schema.delete,
      )
      .get(
        "/transection-list",
        async ({ query, user }) => {
          const entry = await NumberEntryTransection.find({
            game_time: query.gameTime,
            admin: user?._id,
            amount: { $gt: 0 },
          })
            .populate("admin")
            .populate("number");
          return R("transection list", entry);
        },
        schema.taransection_list,
      ),
);
