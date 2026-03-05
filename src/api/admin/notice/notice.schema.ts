import { t } from "elysia";
import { GameTimeSchema } from "../game-time/game-time.schema";

export const resultEntrySchema = t.Object({
  _id: t.Optional(t.String()),
  result_ank: t.Optional(t.String()),
  result_pana: t.Optional(t.String()),
  game: t.Object({
    _id: t.Optional(t.String()),
    name: t.Optional(t.String()),
    result: t.Optional(
      t.Object({
        result_ank: t.Optional(t.String()),
        result_pana: t.Optional(t.String()),
      })
    ),
  }),
  date: t.Date(),
});

export const noticeEntrySchema = t.Object({
  _id: t.String(),
  text: t.String(),
  game_time: GameTimeSchema,
  date: t.Date(),
  createdAt: t.Optional(t.String()),
  updatedAt: t.Optional(t.String()),
});

const MetaPaginationSchema = t.Object({
  pages: t.Number(),
  total: t.Number(),
  page: t.Number(),
  size: t.Number(),
});

export default {
  notice_add: {
    body: t.Object({
      game_time: t.String(),
      text: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Object({
            _id: t.String(),
            game_time: t.String(),
            text: t.String(),
            createdAt: t.Optional(t.String()),
            updatedAt: t.Optional(t.String()),
          }),
        },
        { description: "Notice add Response" }
      ),
    },
    detail: { operationId: "NoticeAdd" },
  },

  notice_list: {
    query: t.Object({
      page: t.String(),
      size: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(noticeEntrySchema),
          meta: MetaPaginationSchema,
        },
        { description: "Notice List Response" }
      ),
    },
    detail: { operationId: "NoticeList" },
  },
};
