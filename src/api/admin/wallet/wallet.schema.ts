import { t } from "elysia";
import { AdminSchema } from "../auth/auth.schema";

const WalletSchema = t.Object({
	_id: t.String(),
	admin: AdminSchema,
	limit: t.Number(),
	used: t.Number(),
	allocated: t.Number(),
	available: t.Number(),
	unlimited: t.Boolean(),
	status: t.Number(),
	version: t.Number(),
});

export default {
	allocate: {
		body: t.Object({
			childAdminId: t.String(),
			amount: t.Number(),
		}),
	},
	adjust: {
		body: t.Object({
			adminId: t.String(),
			amount: t.Number(),
			reason: t.Optional(t.String()),
		}),
	},
	setUnlimited: {
		body: t.Object({
			wallet: t.String(),
			unlimited: t.Boolean(),
		}),
	},
	get: {
		query: t.Object({
			adminId: t.String(),
		}),

		response: {
			200: t.Object({
				status: t.Boolean(),
				message: t.String(),
				data: WalletSchema,
			}),
		},
	},
};
