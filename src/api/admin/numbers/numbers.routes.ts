import { isAdminAuthenticated } from "src/guard/auth.guard";
import { R } from "src/utils/response-helpers";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import Numbers, { NumbersClass } from "src/models/Numbers";
import schema from "./numbers.schema";
import { ModuleId, Summary } from "src/config/modules";
import { RootFilterQuery } from "mongoose";
import GameNumber from "src/models/GameNumber";

export default createElysia({ prefix: "/numbers" }).guard(
  {
    detail: {
      tags: ["Numbers"],
      summary: Summary([ModuleId.NUMBER]),
    },
    beforeHandle: isAdminAuthenticated,
  },
  (app) =>
    app
      .get(
        "/",
        async (ctx) => {
          const page = parseInt(ctx.query.page);
          const size = parseInt(ctx.query.size);

          const game = ctx.query.game;

          const filter: RootFilterQuery<NumbersClass> = {};

          if (game) {
            filter._id = {
              $nin: await GameNumber.find({ game: game }).distinct("number"),
            };
          }

          const entryList = await Numbers.find(filter)
            .skip(page * size)
            .limit(size)
            .sort({
              updatedAt: -1,
            })
            .lean();

          const total = await Numbers.countDocuments(filter);
          const pages = Math.ceil(total / size);

          return R("Number EntryList", entryList, true, {
            pages: pages,
            total: total,
            page: page,
            size: size,
          });
        },
        schema.list
      )
      .post(
        "/",
        async ({ body }) => {
          console.log("calling....");
          console.log("Body", body);
          const entry = await Numbers.create(body);
          console.log("Entry", entry);
          return R("Number Created", entry);
        },
        schema.create
      )
      .put(
        "/",
        async (ctx) => {
          const id = ctx.query.id;
          const entry = await Numbers.findByIdAndUpdate(id, ctx.body);
          return R("Number Updated");
        },
        schema.update
      )
      .delete(
        "/",
        async (ctx) => {
          const GameNumberExits = await GameNumber.find({
            number: ctx?.query?.id,
          });
          if (GameNumberExits.length > 0) {
            return customError(
              "Before Delete this emoji please remove from game"
            );
          }
          const entry = await Numbers.findByIdAndDelete(ctx.query.id);
          return R("Number Deleted", entry);
        },
        schema.delete
      )
);
