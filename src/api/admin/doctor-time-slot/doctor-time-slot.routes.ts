import { R } from "src/utils/response-helpers";
import schema from "./doctor-time-slot.schema";
import DoctorTimeSlot from "src/models/clicknic/DoctorTimeSlot";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import { RootFilterQuery } from "mongoose";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { ModuleId, Summary } from "src/config/modules";
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
					const page = parseInt(query.page);
					const size = parseInt(query.size);

					const filter: RootFilterQuery<typeof DoctorTimeSlot> = normalizeQuery(
						{
							...(query.doctor && { doctor: query.doctor }),
							...(query.clinic && { clinic: query.clinic }),
							deleted: { $ne: true },
						},
						user,
					);

					const [list, total] = await Promise.all([
						DoctorTimeSlot.find(filter)
							.skip(page * size)
							.limit(size)
							.sort({ createdAt: -1 }),
						DoctorTimeSlot.countDocuments(filter),
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
					const entry = await DoctorTimeSlot.create({
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
				async ({ body, query }) => {
					const entry = await DoctorTimeSlot.findByIdAndUpdate(
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
					const entry = await DoctorTimeSlot.findById(query.id);

					if (!entry) return customError("Invalid Doctor Time Slot");

					return R("entry detail", entry);
				},
				schema.detail,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await DoctorTimeSlot.findByIdAndUpdate(query.id, {
						deleted: true,
					});

					return R("entry deleted", entry);
				},
				schema.delete,
			),
);
