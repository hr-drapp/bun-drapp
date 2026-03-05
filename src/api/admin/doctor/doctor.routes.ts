import { R } from "src/utils/response-helpers";
import schema from "./doctor.schema";
import Doctor, { DoctorClass } from "src/models/drapp/Doctor";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import { RootFilterQuery } from "mongoose";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { ModuleId, Summary } from "src/config/modules";

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

					let search = query?.search;
					if (search) {
						search = new RegExp(search, "i") as any;
					}

					const filter: RootFilterQuery<typeof Doctor> = {
						...(search && {
							name: {
								$regex: search,
							},
						}),
					};

					const [list, total] = await Promise.all([
						Doctor.find(filter)
							.skip(page * size)
							.limit(size)
							.sort({ createdAt: -1 }),
						Doctor.countDocuments(filter),
					]);

					const pages = Math.ceil(total / size);

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
					const entry = await Doctor.create({
						...body,
					});

					return R("entry created", entry);
				},
				schema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const entry = await Doctor.findByIdAndUpdate(query.id, body as any);

					return R("entry updated", entry);
				},
				schema.update,
			)
			.get(
				"/detail",
				async ({ body, query }) => {
					const entry = await Doctor.findById(query.id);

					if (!entry) return customError("Invalid Game Category");

					return R("entry updated", entry);
				},
				schema.detail,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await Doctor.findByIdAndDelete(query.id);

					return R("entry deleted", entry);
				},
				schema.delete,
			),
);
