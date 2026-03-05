import { t } from "elysia";
import { adminSchema } from "../admins/admins.schema";

export const name = "HisabComission";

export const hisabComissionSchema = t.Object({
  _id: t.String(),
  comission: t.Optional(t.Number()),
  multiplyer: t.Optional(t.Number()),
  admin: t.Object({
    _id: t.Optional(t.String()),
    name: t.Optional(t.String()),
  }),
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
      page: t.String(),
      size: t.String(),
      search: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Any(t.Array(hisabComissionSchema)),
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
      admin: t.String(),
      comission: t.Number(),
      multiplyer: t.Number(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Any(hisabComissionSchema),
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
    body: t.Object({
      admin: t.Optional(t.String()),
      comission: t.Optional(t.Number()),
      multiplyer: t.Optional(t.Number()),
    }),

    query: t.Object({
      id: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Any(hisabComissionSchema),
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
  detail: {
    query: t.Object({
      id: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Any(hisabComissionSchema),
        },
        {
          description: `${name} update response`,
        }
      ),
    },
    detail: {
      operationId: "detail",
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
          data: hisabComissionSchema,
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
