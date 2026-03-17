import { R } from "src/utils/response-helpers";
import schema from "./appointment.schema";
import Appointment, { AppointmentSource } from "src/models/drapp/Appointment";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import { RootFilterQuery } from "mongoose";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { ModuleId, Summary } from "src/config/modules";
import { normalizeQuery } from "src/utils/access-grants";
import { queryStringtoArray } from "src/utils/common";
import PatientHealthRecord, {
	PatientHealthRecordType,
} from "src/models/drapp/PatientHealthRecord";

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

					const statuses = queryStringtoArray(query.statuses);
					const patients = queryStringtoArray(query.patients);

					let search = query?.search;
					if (search) {
						search = new RegExp(search, "i") as any;
					}

					const filter: RootFilterQuery<typeof Appointment> = normalizeQuery(
						{
							...(search && {
								complaint: {
									$regex: search,
								},
							}),
							...(statuses.length
								? {
										status: {
											$in: statuses,
										},
								  }
								: {}),
							...(patients.length
								? {
										patient: {
											$in: patients,
										},
								  }
								: {}),
						},
						user,
					);

					const [list, total] = await Promise.all([
						Appointment.find(filter)
							.populate([
								{
									path: "doctor",
								},
								{
									path: "patient",
									select: "_id name",
								},
								{
									path: "time_slot",
								},
							])
							.skip(page * size)
							.limit(size)
							.sort({ createdAt: -1 })
							.lean(),
						Appointment.countDocuments(filter),
					]);

					const pages = Math.ceil(total / size);

					const ids = list.map((item) => item._id);
					const healthRecords = await PatientHealthRecord.find({
						appointment: { $in: ids },
					});

					for (let item of list) {
						(item as any).patient_health_records = [];

						const records = healthRecords.filter(
							(f) => f.appointment.toString() === item._id.toString(),
						);

						for (let record of healthRecords) {
							if (record.appointment.toString() === item._id.toString()) {
								if (record.type === PatientHealthRecordType.VITALS) {
									(item as any).vitals = record;
								} else {
									(item as any).patient_health_records.push(record);
								}
							}
						}
					}

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
					const entry = await Appointment.create({
						...body,
						clinic: user.clinic,
						tenant: user.tenant,
						source: AppointmentSource.WALK_IN,
					});

					return R("entry created", entry);
				},
				schema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const entry = await Appointment.findByIdAndUpdate(
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
					const entry = await Appointment.findById(query.id);

					if (!entry) return customError("Invalid Appointment");

					return R("entry detail", entry);
				},
				schema.detail,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await Appointment.findByIdAndUpdate(query.id, {
						deleted: true,
					});

					return R("entry deleted", entry);
				},
				schema.delete,
			),
);
