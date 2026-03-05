import { t } from "elysia";

const name = "Satta Entry";

export const SattaNumberEntrySchema = t.Object({
  _id: t.String(), // ObjectId -> string
  amount: t.Number(),
  number: t.Number(),
  admin: t.String(), // ObjectId -> string
  game: t.String(), // ObjectId -> string
  category: t.Number(),
  source: t.Optional(t.String()),
  market: t.Boolean(),
  date: t.String(), // Date -> ISO string
  createdAt: t.String(),
  updatedAt: t.String(),
  __v: t.Number(),
  satta_entry: t.Optional(t.Any()),
});
const MetaPaginationSchema = t.Object({
  pages: t.Number(),
  total: t.Number(),
  page: t.Number(),
  size: t.Number(),
});

export default {
  list: {
    query: t.Object({
      category: t.String(),
      game: t.String(),
      source: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(SattaNumberEntrySchema),
          meta: MetaPaginationSchema,
        },
        {
          description: `${name} list response`,
        }
      ),
    },
    detail: {
      operationId: "list",
    },
  },
  create: {
    body: t.Object({
      name: t.String(),
      order: t.Numeric(),
      source: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: SattaNumberEntrySchema,
        },
        {
          description: `${name} create response`,
        }
      ),
    },
    detail: {
      operationId: "create",
    },
  },
  update: {
    body: t.Optional(
      t.Object({
        name: t.String(),
        order: t.Numeric(),
      })
    ),
    query: t.Object({
      id: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: SattaNumberEntrySchema,
        },
        {
          description: `${name} update response`,
        }
      ),
    },
    detail: {
      operationId: "update",
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
          data: SattaNumberEntrySchema,
        },
        {
          description: `${name} delete response`,
        }
      ),
    },
    detail: {
      operationId: "delete",
    },
  },
};
