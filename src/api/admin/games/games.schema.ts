import { t } from "elysia";
import { GameCategorySchema } from "../game-category/game-category.schema";

const name = "Games";
export const GameSchema = t.Object({
  _id: t.String(),
  name: t.String(),
  game_category: GameCategorySchema,
});
export const GameTimeSchema = t.Object({
  _id: t.Optional(t.String()),
  game: GameSchema,
  start_time: t.Number(),
  end_time: t.Number(),
  time_range: t.Array(t.Array(t.Number())),
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
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(GameSchema),
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
      game_category: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: GameSchema,
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
        game_category: t.String(),
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
          data: GameSchema,
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
          data: GameSchema,
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
          data: t.Array(GameSchema),
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
};
