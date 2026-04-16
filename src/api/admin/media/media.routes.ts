import { R } from "src/utils/response-helpers";
import schema from "./media.schema";
import Media, { MediaClass } from "src/models/clicknic/media/Media";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import { RootFilterQuery } from "mongoose";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { ModuleId, Summary } from "src/config/modules";
import { normalizeQuery } from "src/utils/access-grants";
import AppWrite from "src/utils/AppWrite";

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

					const filter: RootFilterQuery<typeof Media> = normalizeQuery(
						{
							deleted: false,
							...(search && {
								name: {
									$regex: search,
								},
							}),
						},
						user,
					);

					const [list, total] = await Promise.all([
						Media.find(filter)
							.skip(page * size)
							.limit(size)
							.sort({ createdAt: -1 }),
						Media.countDocuments(filter),
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
					console.log("🚀 ~ body:", body);
					const url = await AppWrite.upload(body.url);
					console.log("🚀 ~ url:", url);
					if (!url) return customError("Failed to upload file");

					const entry = await Media.create({
						name: body.name,
						media_type: body.media_type,
						resource: body.resource,
						url: url,
						size: body.size,
						tenant: user.tenant,
						clinic: user.clinic,
					});

					return R("entry created", entry);
				},
				schema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const updateData: Record<string, any> = { ...body };

					if (body.url) {
						const url = await AppWrite.upload(body.url);
						if (!url) return customError("Failed to upload file");
						updateData.url = url;
					} else {
						delete updateData.url;
					}

					const entry = await Media.findByIdAndUpdate(query.id, updateData, {
						new: true,
					});

					return R("entry updated", entry);
				},
				schema.update,
			)
			.get(
				"/detail",
				async ({ body, query }) => {
					const entry = await Media.findById(query.id);

					if (!entry) return customError("Invalid Media");

					return R("entry detail", entry);
				},
				schema.detail,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await Media.findByIdAndUpdate(
						query.id,
						{ deleted: true },
						{ new: true },
					);

					return R("entry deleted", entry);
				},
				schema.delete,
			),
);
