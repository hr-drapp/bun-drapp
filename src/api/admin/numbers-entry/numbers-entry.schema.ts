import { t } from "elysia";
import { update } from "firebase/database";
import { NumbersSchema } from "../numbers/numbers.schema";

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


const MetaPaginationSchema = t.Object({
  pages: t.Number(),
  total: t.Number(),
  page: t.Number(),
  size: t.Number(),
});

export default {
  create: {
    body: t.Object({
      text: t.String(),
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
          data: NumbersEntrySchema,
        },
        {
          description: "Response Number Creation",
        }
      ),
    },
    detail: {
      operationId: "CreateNumber",
    },
  },
  list: {
    query: t.Object({
      gameTime: t.String(),
      source: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(NumbersEntrySchema),
        },
        {
          definition: "Response Number List",
        }
      ),
    },
    detail: {
      operationId: "ListNumbers",
    },
  },
  update: {
    query: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      text: t.String(),
      // number: t.String(),
      // game: t.String(),
      // source: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: NumbersEntrySchema,
        },
        {
          description: "Response Number Update",
        }
      ),
    },
    detail: {
      operationId: "UpdateNumber",
    },
  },
  delete: {
    query: t.Object({
      id: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: NumbersEntrySchema,
        },
        {
          description: "Response Number Deletion",
        }
      ),
    },
    detail: {
      operationId: "DeleteNumber",
    },
  },
  taransection_list: {
    query: t.Object({
      gameTime: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(NumbersEntrySchema),
        },
        {
          definition: "Response Transection List",
        }
      ),
    },
    detail: {
      operationId: "TransectionListNumbers",
    },
  },
};
