import { R } from "src/utils/response-helpers";
import schema, { name } from "./hisab-comission.schema";
import GameCategory, { GameCategoryClass } from "src/models/GameCategory";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import { RootFilterQuery } from "mongoose";
import { buildScopedQuery } from "src/utils/access-grants";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { ModuleId, Summary } from "src/config/modules";
import HisabCommision, { HisabComissonClass } from "src/models/HisabCommision";
import { RoleLevel } from "src/models/Role";
import Admin from "src/models/drapp/Admin";

export default createElysia({ prefix: "/hisab-comission" }).guard(
	{
		detail: {
			tags: ["HisabComission"],
			summary: Summary([ModuleId.SPINNER_HISAB_COMISSION]),
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

					let fillter: RootFilterQuery<HisabComissonClass> = {};

					if (!user?.super_admin) {
						const childrens = await Admin.find({ parent: user?._id }).select(
							"_id",
						);

						let childrensId = [user?.id, ...childrens.map((c) => c._id)];

						fillter = {
							admin: { $in: childrensId },
						};
					}

					const [list, total] = await Promise.all([
						HisabCommision.find(fillter)
							.populate("admin", "_id name")
							.sort({ createdAt: -1 })
							.skip(page * size)
							.limit(size),
						HisabCommision.countDocuments(fillter),
					]);

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
					const entry = await HisabCommision.create({
						admin: body?.admin,
						comission: body?.comission,
						multiplyer: body.multiplyer,
					});

					return R("entry created", entry);
				},
				schema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const entry = await HisabCommision.findByIdAndUpdate(
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
					const entry = await HisabCommision.findById(query.id);

					if (!entry) return customError("Invalid Game Category");

					return R("entry updated", entry);
				},
				schema.detail,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await HisabCommision.findByIdAndDelete(query.id);

					return R("entry deleted", entry);
				},
				schema.delete,
			),
);
