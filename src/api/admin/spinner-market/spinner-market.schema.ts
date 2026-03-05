import { t } from "elysia";
import { NumbersSchema } from "../numbers/numbers.schema";
import { GameSchema } from "../games/games.schema";
import { GameTimeSchema } from "../game-time/game-time.schema";

export const name = "SpinnerMarket";
export const NumbersEntrySchema = t.Object({
  _id: t.String(),
  number: NumbersSchema,
  amount: t.Number(),
  admin: t.Any(),
  game: t.Any(),
  source: t.String(),
  date: t.String(),
  market: t.Boolean(),
  text: t.Optional(t.String()),
});

export const MarketSchema = t.Object({
  _id: t.Optional(t.String()),
  client_name: t.String(),
  transection: t.Optional(t.Any()),
  admin: t.Optional(t.Any()),
  game_time: t.Object({
    _id: t.Optional(t.String()),
    game: GameSchema,
    start: t.Optional(t.Number()),
    end: t.Optional(t.Number()),
  }),
  date: t.Optional(t.String()),
  token: t.Optional(t.String()),
  payment_completed: t.Optional(t.Boolean()),
});

const MetaPaginationSchema = t.Object({
  pages: t.Number(),
  total: t.Number(),
  page: t.Number(),
  size: t.Number(),
});

export default {
  add_market: {
    body: t.Object({
      text: t.String(),
      client_name: t.String(),
      // total_amount: t.Numeric(),
      // numbers: t.Array(t.String()),
      // numbers_map: t.Optional(t.Any()),
      game_time: t.String(),
      source: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Any(NumbersEntrySchema),
        },
        {
          description: "Spinner market add response",
        },
      ),
    },
    detail: {
      operationId: "AddMarket",
    },
  },
  list_market: {
    query: t.Object({
      gameTime: t.String(),
      dateFrom: t.Optional(t.String()),
      dateTo: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(MarketSchema),
        },
        {
          description: `Market list response`,
        },
      ),
    },
    detail: {
      operationId: "list_market",
    },
  },
  delete: {
    query: t.Object({
      id: t.String(),
    }),
    response: {
      200: t.Object(
        {
          message: t.String(),
          status: t.Boolean(),
          data: MarketSchema,
        },
        {
          description: "Market Delete",
        },
      ),
    },
    detail: {
      operationId: "MarketDelete",
    },
  },
  payment_complete: {
    query: t.Object({
      id: t.String(),
    }),
    response: {
      200: t.Object(
        {
          message: t.String(),
          status: t.Boolean(),
          data: MarketSchema,
        },
        {
          description: "Market Payment Complete",
        },
      ),
    },
    detail: {
      operationId: "PaymentComplete",
    },
  },
};
