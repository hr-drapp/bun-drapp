import { R } from "src/utils/response-helpers";
import schema from "./village.schema";
import Village from "src/models/clicknic/Village";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import { RootFilterQuery } from "mongoose";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { Summary } from "src/config/modules";
import { normalizeQuery } from "src/utils/access-grants";

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
					const page = parseInt(query.page) || 0;
					const size = parseInt(query.size) || 10;
					const deleted = query?.deleted === "true";

					let search = query?.search?.trim();
					let searchRegex: RegExp | undefined;
					if (search) {
						searchRegex = new RegExp(
							search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
							"i",
						);
					}

					const filter: RootFilterQuery<typeof Village> = normalizeQuery(
						{
							...(searchRegex && {
								name: {
									$regex: searchRegex,
								},
							}),
							deleted: deleted,
						},
						user,
					);

					const [list, total] = await Promise.all([
						Village.find(filter)
							.skip(page * size)
							.limit(size)
							.sort({ name: 1, createdAt: -1 }),
						Village.countDocuments(filter),
					]);

					const pages = Math.ceil(total / size) || 1;

					return R(`${schema.meta.name} list data`, list, true, {
						pages: pages,
						total: total,
						page: page,
						size: size,
					});
				},
				schema.list,
			)

			.post(
				"/",
				async ({ body, user }) => {
					const entry = await Village.create({
						...body,
						clinic: user.clinic,
						tenant: user.tenant,
					});

					return R("entry created", entry);
				},
				schema.create,
			)
			.put(
				"/",
				async ({ body, query, user }) => {
					const filter = normalizeQuery({ _id: query.id }, user);
					const entry = await Village.findOneAndUpdate(filter, body as any, {
						new: true,
					});

					if (!entry) return customError("Invalid Village");

					return R("entry updated", entry);
				},
				schema.update,
			)
			.get(
				"/detail",
				async ({ query, user }) => {
					const filter = normalizeQuery({ _id: query.id }, user);
					const entry = await Village.findOne(filter).lean();

					if (!entry) return customError("Invalid Village");

					return R("entry detail", entry);
				},
				schema.detail,
			)
			.delete(
				"/",
				async ({ query, user }) => {
					const filter = normalizeQuery({ _id: query.id }, user);
					const entry = await Village.findOne(filter);

					if (entry) {
						entry.deleted = !entry.deleted;
						await entry.save();
					} else {
						return customError("Invalid Village");
					}

					return R("entry deleted", entry);
				},
				schema.delete,
			),
);
