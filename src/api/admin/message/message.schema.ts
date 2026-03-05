import { t } from "elysia";

export const messageSchema = t.Object({
  _id: t.Optional(t.String()),
  text: t.Optional(t.String()),
  messageId: t.Optional(t.String()),
  group: t.Object({
    _id: t.Optional(t.String()),
    name: t.Optional(t.String()),
    adminId: t.Optional(t.Array(t.String())),
    groupId: t.Optional(t.String()),
  }),
  user: t.Object({
    _id: t.Optional(t.String()),
    name: t.Optional(t.String()),
  }),
});

export const metaPaginationSchema = t.Object({
  total: t.Number(),
  pages: t.Number(),
  page: t.Number(),
  size: t.Number(),
});

export default {
  list: {
    query: t.Object({
      page: t.String(),
      size: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(messageSchema),
          meta: metaPaginationSchema,
        },
        {
          description: "Message List Response",
        }
      ),
    },
    detail: {
      optionalId: "MessageList",
    },
  },
  log_list: {
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Any(),
        },
        {
          description: "Periskop Log Response",
        }
      ),
    },
    detail: {
      operationId: "PeriskopLogs",
    },
  },
};
