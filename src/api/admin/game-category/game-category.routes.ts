import { R } from "src/utils/response-helpers";
import schema, { name } from "./game-category.schema";
import GameCategory, { GameCategoryClass } from "src/models/GameCategory";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import { RootFilterQuery } from "mongoose";
import { buildScopedQuery } from "src/utils/access-grants";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { ModuleId, Summary } from "src/config/modules";

export default createElysia({ prefix: "/game-category" }).guard(
	{
		detail: {
			tags: ["GameCategory"],
			summary: Summary([ModuleId.GAME_CATEGORY]),
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

					let search = query?.search;
					if (search) {
						search = new RegExp(search, "i") as any;
					}

					const filter: RootFilterQuery<GameCategoryClass> = {
						...(search && {
							name: {
								$regex: search,
							},
						}),
					};

					const list = await GameCategory.find(filter)
						.skip(page * size)
						.limit(size)
						.sort({ createdAt: -1 });

					const total = await GameCategory.countDocuments(filter);

					const pages = Math.ceil(total / size);

					return R(`${name} list data`, list, true, {
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
					const entry = await GameCategory.create({
						...body,
					});

					return R("entry created", entry);
				},
				schema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const entry = await GameCategory.findByIdAndUpdate(
						query.id,
						body as any,
					);

					return R("entry updated", entry);
				},
				schema.update,
			)
			.get(
				"/detail",
				async ({ body, query }) => {
					const entry = await GameCategory.findById(query.id);

					if (!entry) return customError("Invalid Game Category");

					return R("entry updated", entry);
				},
				schema.detail,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await GameCategory.findByIdAndDelete(query.id);

					return R("entry deleted", entry);
				},
				schema.delete,
			),
);
