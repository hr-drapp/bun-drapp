import { t } from "elysia";
import { RoleSchema } from "../roles/roles.schema";

const dashboardDataSchema = t.Object({
  todays_total_amount: t.Number(),
  total_master_count: t.Number(),
  total_team_members_count: t.Number(),
  total_master_contribution: t.Number(),
  total_team_member_contribution: t.Number(),
});

const grandTotalSchema = t.Object({
  grand_total: t.Number(),
  admin_entries: t.Array(
    t.Object({
      _id: t.String(),
      totalAmount: t.Number(),
      SattaEntry: t.Array(t.String()),
      admin: t.Object({
        _id: t.String(),
        name: t.String(),
        phone: t.String(),
        role: t.Object({
          _id: t.String(),
          name: t.String(),
        }),
      }),
    })
  ),
  number_entries: t.Array(
    t.Object({
      number: t.Number(),
      amount: t.Number(),
      category: t.Number(),
    })
  ),
  date_range: t.String(),
});

const MetaPaginationSchema = t.Object({
  pages: t.Number(),
  total: t.Number(),
  page: t.Number(),
  size: t.Number(),
});

export default {
  insights: {
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: dashboardDataSchema,
        },
        {
          description: "dashboard Response",
        }
      ),
    },
    detail: {
      operationId: "insights",
    },
  },
  grandTotal: {
    body: t.Object({
      admin_ids: t.Optional(t.Any()),
      game_ids: t.Optional(t.Array(t.String())),
      date_from: t.Optional(t.String()),
      date_to: t.Optional(t.String()),
      category: t.Optional(t.String()),
      admin_type: t.Optional(t.String()),
    }),
    response: {
      200: t.Object(
        {
          status: t.Boolean(),
          message: t.String(),
          data: t.Any(grandTotalSchema),
        },
        {
          description: "dashboard Response",
        }
      ),
    },
    detail: {
      operationId: "grandTotal",
    },
  },
};
