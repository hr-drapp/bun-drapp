import { t } from "elysia";
import { GameCategorySchema } from "../game-category/game-category.schema";

const name = "WalletTransaction";
export const WalletTransaction = t.Object({
	_id: t.String(),
	wallet: t.String(),
	admin: t.String(),
	type: t.String(),
	amount: t.Number(),
	refType: t.Number(),
	refId: t.Number(),
	meta: t.Any(),
	createdAt: t.String(),
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
			wallet: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(WalletTransaction),
					meta: MetaPaginationSchema,
				},
				{
					description: `${name} list response`,
				},
			),
		},
		detail: {
			operationId: "list",
		},
	},
};
