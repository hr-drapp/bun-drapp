import { R } from "src/utils/response-helpers";
import schema from "./patient.schema";
import Patient from "src/models/drapp/Patient";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import { RootFilterQuery } from "mongoose";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { ModuleId, Summary } from "src/config/modules";
import { normalizeQuery } from "src/utils/access-grants";
import Appointment, { AppointmentStatus } from "src/models/drapp/Appointment";
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

					let search = query?.search;
					if (search) {
						search = new RegExp(search, "i") as any;
					}

					const filter: RootFilterQuery<typeof Patient> = normalizeQuery(
						{
							...(search && {
								name: {
									$regex: search,
								},
							}),
						},
						user,
					);

					const [list, total] = await Promise.all([
						Patient.find(filter)
							.skip(page * size)
							.limit(size)
							.sort({ createdAt: -1 }),
						Patient.countDocuments(filter),
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
					const entry = await Patient.create({
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
					const entry = await Patient.findByIdAndUpdate(query.id, body as any);

					return R("entry updated", entry);
				},
				schema.update,
			)
			.get(
				"/detail",
				async ({ body, query }) => {
					const entry = await Patient.findById(query.id).lean();

					if (!entry) return customError("Invalid Patient");

					const recentLiveAppointment = await Appointment.find({
						patient: entry._id,
						status: {
							$in: [
								AppointmentStatus.BOOKED,
								AppointmentStatus.IN_SESSION,
								AppointmentStatus.PAUSED,
							],
						},
					}).populate([
						{
							path: "doctor",
						},
						{
							path: "time_slot",
						},
					]);

					(entry as any).recent_appointment =
						recentLiveAppointment.length > 0 ? recentLiveAppointment[0] : null;

					if ((entry as any).recent_appointment) {
						const vitals = await PatientHealthRecord.findOne({
							appointment: (entry as any).recent_appointment._id,
							type: PatientHealthRecordType.VITALS,
						});

						(entry as any).vitals = vitals;
					}

					return R("entry detail", entry);
				},
				schema.detail,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await Patient.findByIdAndUpdate(query.id, {
						deleted: true,
					});

					return R("entry deleted", entry);
				},
				schema.delete,
			),
);
