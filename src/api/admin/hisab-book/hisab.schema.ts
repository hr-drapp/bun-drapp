import { t } from "elysia";
import { GameTimeSchema } from "../game-time/game-time.schema";

export const storeHisabSchema = t.Object({
  admin: t.Object({
    name: t.Optional(t.String()),
    email: t.Optional(t.String()),
    phone: t.Optional(t.String()),
  }),
  game_time: GameTimeSchema,
  game_number: t.Any(),
  game_number_amt: t.Any(),
  grand_total: t.Number(),
  sub_total: t.Number(),
  game_total: t.Number(),
  emoji_total: t.Number(),
});

export default {
  list: {
    body: t.Object({
      game_time: t.Optional(t.Any()),
      admin: t.Optional(t.Any()),
      date_from: t.Optional(t.String()),
      date_to: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(storeHisabSchema),
        },
        {
          description: "Hisab Book Insights",
        },
      ),
    },
    detail: {
      operationId: "HisabInsights",
    },
  },
};
