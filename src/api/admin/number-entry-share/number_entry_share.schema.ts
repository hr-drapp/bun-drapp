import { t } from "elysia";

const name = "Satta Entry Share";

export const NumberEntrySchema = t.Object({
  _id: t.String(),
  category: t.Number(),
  game: t.String(),
  game_time: t.String(),
  date: t.Date(),

  team_member: t.Optional(t.String()),
  team_member_share: t.Optional(t.Number()),
  team_member_share_type: t.Optional(t.String()),

  master: t.Optional(t.String()),
  master_share: t.Optional(t.Number()),
  master_share_type: t.Optional(t.String()),

  super_admin: t.Optional(t.String()),
  super_admin_share: t.Optional(t.Number()),
  super_admin_share_type: t.Optional(t.String()),
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
      category: t.Number(),
      game: t.String(),
      game_time: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(NumberEntrySchema),
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
      type: t.String(),
      share: t.Number(),
      category: t.Number(),
      game_time: t.String(),
      game: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Any(NumberEntrySchema),
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
          data: NumberEntrySchema,
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
          data: NumberEntrySchema,
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
