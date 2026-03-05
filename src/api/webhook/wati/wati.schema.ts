import { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";

export const groupSchema = t.Object({
  name: t.Optional(t.String()),
  groupId: t.Optional(t.Array(t.String())),
  adminId: t.Optional(t.Array(t.String())),
  type: t.Optional(t.String()),
});

const MetaPaginationSchema = t.Object({
  pages: t.Number(),
  total: t.Number(),
  page: t.Number(),
  size: t.Number(),
});
export default {
  message_received: {
    // body: t.Object({
    // 	// id: t.Optional(t.Nullable(t.String())),
    // 	// created: t.Optional(t.Nullable(t.String())),
    // 	// whatsappMessageId: t.Optional(t.Nullable(t.String())),
    // 	// conversationId: t.Optional(t.Nullable(t.String())),
    // 	// ticketId: t.Optional(t.Nullable(t.String())),
    // 	text: t.Optional(t.Nullable(t.String())),
    // 	// type: t.Optional(t.Nullable(t.String())),
    // 	// data: t.Optional(t.Nullable(t.Any())),
    // 	// timestamp: t.Optional(t.Nullable(t.String())),
    // 	// owner: t.Optional(t.Nullable(t.Boolean())),
    // 	// eventType: t.Optional(t.Nullable(t.String())),
    // 	// statusString: t.Optional(t.Nullable(t.String())),
    // 	// avatarUrl: t.Optional(t.Nullable(t.String())),
    // 	// assignedId: t.Optional(t.Nullable(t.String())),
    // 	// operatorName: t.Optional(t.Nullable(t.String())),
    // 	// operatorEmail: t.Optional(t.Nullable(t.String())),
    // 	waId: t.Optional(t.Nullable(t.String())),
    // 	// messageContact: t.Optional(t.Nullable(t.Any())),
    // 	// senderName: t.Optional(t.Nullable(t.String())),
    // 	// listReply: t.Optional(t.Nullable(t.Any())),
    // 	// replyContextId: t.Optional(t.Nullable(t.String())),
    // }),
    body: t.Any(),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Any(),
        },
        {
          description: "wati webhook response",
        }
      ),
    },
    detail: {
      operationId: "watiMessageReceived",
    },
  },
  send_message: {
    query: t.Object({
      game_name: t.String(),
    }),

    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Any(),
        },
        {
          description: "Recived Game Response",
        }
      ),
    },
    detail: {
      operationId: "Game Message Send",
    },
  },
  resut: {
    body: t.Object({
      gameName: t.Optional(t.String()),
      number: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Any(),
        },
        {
          descriptions: "Game Result Response",
        }
      ),
    },
    detail: {
      operationId: "GameResultId",
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
          description: "Log List Response",
        }
      ),
    },
    detail: {
      operationId: "LogList",
    },
  },
};
