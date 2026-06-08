import { R } from "src/utils/response-helpers";
import schema from "./dashboard.schema";
import Appointment, {
	AppointmentSource,
	AppointmentStatus,
} from "src/models/clicknic/Appointment";
import DoctorTimeSlot from "src/models/clicknic/DoctorTimeSlot";
import { createElysia } from "src/utils/createElysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { Summary } from "src/config/modules";
import { normalizeQuery } from "src/utils/access-grants";
import moment from "moment";

export default createElysia({ prefix: schema.meta.name }).guard(
	{
		detail: {
			tags: [schema.meta.name],
			summary: Summary([schema.meta.module]),
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app.get(
			"/insight",
			async ({ user }) => {
				const today = moment().startOf("day").toDate();
				const todayEnd = moment().endOf("day").toDate();
				const currentMinutes = moment().hours() * 60 + moment().minutes();

				const todayFilter = normalizeQuery(
					{ date: { $gte: today, $lte: todayEnd }, deleted: false },
					user,
				);

				const activeFilter = normalizeQuery(
					{
						status: { $in: [AppointmentStatus.IN_SESSION, AppointmentStatus.PAUSED] },
						deleted: false,
					},
					user,
				);

				const activeSlotFilter = normalizeQuery(
					{
						start: { $lte: currentMinutes },
						end: { $gte: currentMinutes },
						deleted: false,
					},
					user,
				);

				const [todayAppointments, activeSessions, activeSlots] = await Promise.all([
					Appointment.find(todayFilter).lean(),
					Appointment.countDocuments(activeFilter),
					DoctorTimeSlot.find(activeSlotFilter)
						.populate({ path: "doctor", select: "_id name profile_pic" })
						.lean(),
				]);

				let walk_in_patients = 0;
				for (const appt of todayAppointments) {
					if (appt.source === AppointmentSource.WALK_IN) walk_in_patients++;
				}

				const doctors = Array.from(
					new Map(
						activeSlots
							.map((slot) => slot.doctor as any)
							.filter((doc) => doc?._id)
							.map((doc) => [
								doc._id.toString(),
								{
									_id: doc._id.toString(),
									name: doc.name ?? "",
									profile_pic: doc.profile_pic ?? "",
									appointment_count: 0,
								},
							]),
					).values(),
				);

				return R("dashboard insight", {
					total_appointments: todayAppointments.length,
					doctors_available: doctors.length,
					active_sessions: activeSessions,
					walk_in_patients,
					doctors,
				});
			},
			schema.insight,
		),
);
