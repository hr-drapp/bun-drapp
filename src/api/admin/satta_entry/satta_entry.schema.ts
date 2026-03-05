import { t } from "elysia";

const name = "Satta Entry";

export const SattaEntrySchema = t.Object({
  _id: t.String(),
  amount: t.Number(),
  text: t.Optional(t.Any()),
  total_amount: t.Optional(t.Any()),
  numbers: t.Optional(t.Array(t.Any())),
  numbers_map: t.Optional(t.Any()),
  admin: t.Optional(t.Any()),
  game: t.Optional(t.Any()),
  category: t.Optional(t.Any()),
  source: t.Optional(t.Any()),
  date: t.Optional(t.Any()),
  result_ank: t.Optional(t.Any()),
  result_pana: t.Optional(t.Any()),
});

export const ClientSchema = t.Object({
  _id: t.String(),
  name: t.String(),
});

const MetaPaginationSchema = t.Object({
  pages: t.Number(),
  total: t.Number(),
  page: t.Number(),
  size: t.Number(),
});
// v2
export default {
  list: {
    query: t.Object({
      page: t.String(),
      size: t.String(),
      game: t.String(),
      category: t.String(),
      source: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(SattaEntrySchema),
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
  list_market: {
    query: t.Object({
      page: t.String(),
      size: t.String(),
      game: t.String(),
      dateFrom: t.Optional(t.String()),
      dateTo: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Array(SattaEntrySchema),
          meta: MetaPaginationSchema,
        },
        {
          description: `${name} list response`,
        }
      ),
    },
    detail: {
      operationId: "list_market",
    },
  },
  create: {
    body: t.Object({
      text: t.String(),
      amount: t.Numeric(),
      total_amount: t.Numeric(),
      numbers: t.Array(t.Number()),
      numbers_map: t.Optional(t.Any()),
      game: t.String(),
      category: t.String(),
      source: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: SattaEntrySchema,
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
  create_mix: {
    body: t.Object({
      single: t.Optional(
        t.Array(
          t.Optional(
            t.Object({
              text: t.String(),
              amount: t.Numeric(),
              total_amount: t.Numeric(),
              numbers: t.Array(t.Numeric()),
              numbers_map: t.Optional(t.Any()),
              category: t.String(),
            })
          )
        )
      ),
      jodi: t.Optional(
        t.Array(
          t.Optional(
            t.Object({
              text: t.String(),
              amount: t.Numeric(),
              total_amount: t.Numeric(),
              numbers: t.Array(t.Numeric()),
              numbers_map: t.Optional(t.Any()),
              category: t.String(),
              source: t.Optional(t.String()),
            })
          )
        )
      ),
      pana: t.Optional(
        t.Array(
          t.Optional(
            t.Object({
              text: t.String(),
              amount: t.Numeric(),
              total_amount: t.Numeric(),
              numbers: t.Array(t.Numeric()),
              numbers_map: t.Optional(t.Any()),
              category: t.String(),
              source: t.Optional(t.String()),
            })
          )
        )
      ),
      game: t.String(),
      source: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: SattaEntrySchema,
        },
        {
          description: `${name} create response`,
        }
      ),
    },
    detail: {
      operationId: "create_mix",
    },
  },
  add_market: {
    body: t.Object({
      client_name: t.String(),
      single: t.Optional(
        t.Array(
          t.Object({
            text: t.String(),
            result: t.Object({
              amount: t.Numeric(),
              total_amount: t.Numeric(),
              numbers: t.Array(t.Numeric()),
              numbers_map: t.Optional(t.Any()),
            }),
          })
        )
      ),
      jodi: t.Optional(
        t.Array(
          t.Object({
            text: t.String(),
            result: t.Object({
              amount: t.Numeric(),
              total_amount: t.Numeric(),
              numbers: t.Array(t.Numeric()),
              numbers_map: t.Optional(t.Any()),
            }),
          })
        )
      ),
      pana: t.Optional(
        t.Array(
          t.Object({
            text: t.String(),
            type: t.String(),
            result: t.Object({
              amount: t.Numeric(),
              total_amount: t.Numeric(),
              numbers: t.Array(t.Numeric()),
              numbers_map: t.Optional(t.Any()),
            }),
          })
        )
      ),
      andar: t.Optional(
        t.Array(
          t.Object({
            text: t.String(),
            result: t.Object({
              amount: t.Numeric(),
              total_amount: t.Numeric(),
              numbers: t.Array(t.Numeric()),
              numbers_map: t.Optional(t.Any()),
              source: t.Optional(t.String()),
            }),
          })
        )
      ),
      bahar: t.Optional(
        t.Array(
          t.Object({
            text: t.String(),
            result: t.Object({
              amount: t.Numeric(),
              total_amount: t.Numeric(),
              numbers: t.Array(t.Numeric()),
              numbers_map: t.Optional(t.Any()),
              source: t.Optional(t.String()),
            }),
          })
        )
      ),
      total: t.Optional(
        t.Array(
          t.Object({
            text: t.String(),
            result: t.Object({
              amount: t.Numeric(),
              total_amount: t.Numeric(),
              numbers: t.Array(t.Numeric()),
              numbers_map: t.Optional(t.Any()),
              source: t.Optional(t.String()),
            }),
          })
        )
      ),
      game: t.String(),
      type: t.Number(),
      source: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: SattaEntrySchema,
        },
        {
          description: `${name} create response`,
        }
      ),
    },
    detail: {
      operationId: "add_market",
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
          data: SattaEntrySchema,
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

  complete_payment: {
    query: t.Object({
      id: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: SattaEntrySchema,
        },
        {
          description: `${name} update response`,
        }
      ),
    },
    detail: {
      operationId: "complete_payment",
    },
  },
  delete_payment: {
    query: t.Object({
      id: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: SattaEntrySchema,
        },
        {
          description: `${name} update response`,
        }
      ),
    },
    detail: {
      operationId: "delete_payment",
    },
  },
  add_client: {
    body: t.Object({
      name: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: ClientSchema,
        },
        {
          description: `add client response`,
        }
      ),
    },
    detail: {
      operationId: "add_client",
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
          data: SattaEntrySchema,
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
  reset: {
    query: t.Object({
      game: t.String(),
      category: t.String(),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: SattaEntrySchema,
        },
        {
          description: `${name} reset response`,
        }
      ),
    },
    detail: {
      operationId: "reset",
    },
  },
};
