import { R } from "src/utils/response-helpers";
import schema from "./patient-health-record.schema";
import PatientHealthRecord from "src/models/clicknic/PatientHealthRecord";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import { RootFilterQuery } from "mongoose";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { ModuleId, Summary } from "src/config/modules";
import { normalizeQuery } from "src/utils/access-grants";
import Appointment from "src/models/clicknic/Appointment";

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

					const filter: RootFilterQuery<typeof PatientHealthRecord> =
						normalizeQuery(
							{
								...(query.patient && { patient: query.patient }),
								...(query.doctor && { doctor: query.doctor }),
								...(query.appointment && {
									appointment: query.appointment,
								}),
								...(query.status && {
									status: parseInt(query.status),
								}),
								...(query.type && { type: parseInt(query.type) }),
							},
							user,
						);

					const [list, total] = await Promise.all([
						PatientHealthRecord.find(filter)
							.skip(page * size)
							.limit(size)
							.sort({ createdAt: -1 }),
						PatientHealthRecord.countDocuments(filter),
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
					// put doctor and patient object id from the appointment if appointment is there.
					if (body.appointment) {
						const appointment = await Appointment.findById(
							body.appointment,
						).select({
							_id: 1,
							doctor: 1,
							patient: 1,
						});
						if (!appointment) return customError("invalid appointment");

						body.doctor = appointment.doctor as any;
						body.patient = appointment.patient as any;

						const entry = await PatientHealthRecord.findOne({
							appointment: body.appointment,
							type: body.type,
						});

						if (entry) {
							if (body.values) {
								entry.values = body.values;
							}
							if (body.attachments) {
								entry.attachments = body.attachments;
							}

							await entry.save();
							return R("entry created");
						}
					}

					const entry = await PatientHealthRecord.create({
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
					const entry = await PatientHealthRecord.findByIdAndUpdate(
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
					const entry = await PatientHealthRecord.findById(query.id);

					if (!entry) return customError("Invalid Patient Health Record");

					return R("entry detail", entry);
				},
				schema.detail,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await PatientHealthRecord.findByIdAndUpdate(query.id, {
						deleted: true,
					});

					return R("entry deleted", entry);
				},
				schema.delete,
			),
);
