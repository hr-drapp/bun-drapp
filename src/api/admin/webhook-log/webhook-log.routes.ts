import { R } from "src/utils/response-helpers";
import schema from "./webhook-log.schema";
import WebhookLog from "src/models/clicknic/WebhookLog";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { Summary } from "src/config/modules";
import { normalizeQuery } from "src/utils/access-grants";

/**
 * A log only gets a clinic once the webhook resolves one. Calls that never got
 * that far (bad token, missing number) have no clinic and are shown to every
 * clinic, otherwise they would be invisible exactly when debugging is needed.
 */
const scopeFilter = (user: any) => {
	const { tenant, clinic } = normalizeQuery({}, user);
	return {
		$or: [{ clinic, tenant }, { clinic: { $exists: false } }, { clinic: null }],
	};
};

export default createElysia({ prefix: schema.meta.name }).guard(
	{
		detail: {
			tags: [schema.meta.name],
			summary: Summary([schema.meta.module]),
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.get(
				"/",
				async ({ query, user }) => {
					const page = parseInt(query.page);
					const size = parseInt(query.size);

					const search = query?.search?.trim();
					const regex = search
						? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
						: null;

					const filter = {
						$and: [
							scopeFilter(user),
							...(regex
								? [{ $or: [{ execution_id: regex }, { contact_number: regex }] }]
								: []),
						],
						...(query.status && { status: query.status }),
						...(query.event && { event: query.event }),
					};

					const [list, total] = await Promise.all([
						WebhookLog.find(filter)
							.populate({ path: "patient", select: "_id name phone" })
							.skip(page * size)
							.limit(size)
							.sort({ createdAt: -1 })
							.lean(),
						WebhookLog.countDocuments(filter),
					]);

					return R(`${schema.meta.name} list data`, list, true, {
						pages: Math.ceil(total / size),
						total,
						page,
						size,
					});
				},
				schema.list,
			)
			.get(
				"/detail",
				async ({ query, user }) => {
					const entry = await WebhookLog.findOne({
						_id: query.id,
						...scopeFilter(user),
					})
						.populate({ path: "patient", select: "_id name phone" })
						.lean();

					if (!entry) return customError("Invalid entry");
					return R("entry detail", entry);
				},
				schema.detail,
			),
);
