import { t } from "elysia";
import { MetaPaginationSchema } from "src/utils/common";

const name = "contribution";

const publicDetailSchema = t.Object({
	_id: t.String(),
	name: t.String(),
	phone: t.String(),
	amount: t.Number(),
	createdAt: t.String(),
});

export default {
	meta: { name },
	submit: {
		body: t.Object({
			name: t.String({ minLength: 1 }),
			phone: t.String({ minLength: 10, maxLength: 15 }),
			amount: t.Number({ minimum: 1 }),
		}),
		response: {
			200: t.Object({
				status: t.Boolean(),
				message: t.String(),
				data: t.Object({
					_id: t.String(),
					name: t.String(),
					amount: t.Number(),
					createdAt: t.String(),
				}),
			}),
		},
		detail: { operationId: "submit" },
	},
	list: {
		query: t.Object({
			page: t.String(),
			size: t.String(),
		}),
		response: {
			200: t.Object({
				status: t.Boolean(),
				message: t.String(),
				data: t.Array(publicDetailSchema),
				meta: MetaPaginationSchema,
			}),
		},
		detail: { operationId: "list" },
	},
	analytics: {
		response: {
			200: t.Object({
				status: t.Boolean(),
				message: t.String(),
				data: t.Object({
					total_amount: t.Number(),
					total_contributors: t.Number(),
				}),
			}),
		},
		detail: { operationId: "analytics" },
	},
};
