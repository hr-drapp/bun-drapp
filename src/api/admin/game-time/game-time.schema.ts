import { t } from "elysia";
import { GameCategorySchema } from "../game-category/game-category.schema";
import { GameSchema } from "../games/games.schema";

export const name = "Game Time";

export const GameTimeSchema = t.Object({
  _id: t.String(),
  start: t.Number(),
  end: t.Number(),
  entry_margin: t.Optional(t.Number()),
  result_margin: t.Optional(t.Number()),
  game: GameSchema,
  group_game_time: t.String(),
  auto_result: t.Optional(t.Boolean()),
  win_margin: t.Optional(t.Number()),
});

const MetaPaginationSchema = t.Object({
  pages: t.Number(),
  total: t.Number(),
  page: t.Number(),
  size: t.Number(),
});

const resultGameSchema = t.Object({
  _id: t.Optional(t.String()),
  game_time: GameTimeSchema,
  game_number: t.Optional(t.String()),
});

export default {
  list: {
    query: t.Object({
      page: t.String(),
      size: t.String(),
      game: t.Optional(t.String()),
      search: t.Optional(t.String()),
      group: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(GameTimeSchema),
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
      game: t.String(),
      start: t.Number(),
      end: t.Number(),
      entry_margin: t.Optional(t.Number()),
      result_margin: t.Optional(t.Number()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: GameTimeSchema,
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
        start: t.Number(),
        end: t.Number(),
        entry_margin: t.Optional(t.Number()),
        result_margin: t.Optional(t.Number()),
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
          data: GameTimeSchema,
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
          data: GameTimeSchema,
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
  timeout_game: {
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(GameTimeSchema),
        },
        {
          description: "TimeOut Game List",
        }
      ),
    },
    detail: {
      operationId: "TimeoutGame",
    },
  },
  result_game: {
    query: t.Object({
      dateTo: t.Optional(t.String()),
      dateFrom: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(resultGameSchema),
          //   meta: MetaPaginationSchema,
        },
        {
          description: `${name} list response`,
        }
      ),
    },
    detail: {
      operationId: "ResultGame",
    },
  },
  game_time_list: {
    query: t.Object({
      game_id: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(GameTimeSchema),
        },
        {
          description: "Game Time List",
        }
      ),
    },
    detail: {
      operationId: "GameTimeList",
    },
  },
  game_time_add: {
    query: t.Object({
      game_id: t.String(),
    }),
    body: t.Object({
      time_range: t.Array(t.Array(t.Number())),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: GameTimeSchema,
        },
        {
          description: "Game Time Add",
        }
      ),
    },
    detail: {
      operationId: "GameTimeAdd",
    },
  },
  auto_result: {
    query: t.Object({
      id: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Any(GameTimeSchema),
        },
        {
          description: `${name} Auto Result Response`,
        }
      ),
    },
    detail: {
      operationId: "AutoResult",
    },
  },
  win_margin: {
    body: t.Object({
      win_margin: t.Number(),
    }),
    query: t.Object({
      id: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Any(GameTimeSchema),
        },
        {
          description: `${name} Auto Result Response`,
        }
      ),
    },
    detail: {
      operationId: "WinMargin",
    },
  },
};
