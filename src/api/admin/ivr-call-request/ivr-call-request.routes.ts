import { R } from "src/utils/response-helpers";
import schema from "./ivr-call-request.schema";
import IvrCallRequest, {
	IVR_ACTIVE_TIMEOUT_MINUTES,
} from "src/models/clicknic/IvrCallRequest";
import Patient from "src/models/clicknic/Patient";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { Summary } from "src/config/modules";
import { normalizeQuery } from "src/utils/access-grants";
import { RoleLevel } from "src/models/clicknic/Role";
import { normalizePhone } from "src/api/webhook/bolna/bolna.service";
import moment from "moment";

const patientPopulate = {
	path: "patient",
	select: "_id id name phone age gender profile_pic",
};

/** Doctor logins see only calls routed to their own phone; everyone else sees the clinic. */
const isDoctorLogin = (user: any) =>
	!user?.super_admin && user?.role?.level === RoleLevel.L2;

/** Clinic/tenant scope, narrowed to the doctor's calls (by agent_number) for doctor logins. */
const scopeFilter = <T extends Record<string, any>>(query: T, user: any) => {
	const { doctor, ...filter } = normalizeQuery(query, user) as any;
	if (isDoctorLogin(user)) {
		filter.agent_number = normalizePhone(user.ivr_agent_number || user.phone).local;
	}
	return filter as T & { tenant: any; clinic: any };
};

/**
 * If Bolna's status webhook never arrives (misconfigured, dropped), a call
 * would look live forever. Expire calls with no update past the timeout.
 */
const expireStaleCalls = (scope: { tenant: any; clinic: any }) =>
	IvrCallRequest.updateMany(
		{
			...scope,
			is_active: true,
			updatedAt: {
				$lt: moment().subtract(IVR_ACTIVE_TIMEOUT_MINUTES, "minutes").toDate(),
			},
		},
		{ $set: { is_active: false, status: "timed-out", ended_at: new Date() } },
	);

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
					const deleted = query?.deleted === "true";

					const scope = scopeFilter({}, user);
					await expireStaleCalls(scope);

					const search = query?.search?.trim();
					let patientIds: any[] | undefined;
					if (search) {
						const regex = new RegExp(
							search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
							"i",
						);
						const patients = await Patient.find(
							{
								tenant: scope.tenant,
								clinic: scope.clinic,
								$or: [{ name: regex }, { phone: regex }],
							},
							{ _id: 1 },
						).lean();
						patientIds = patients.map((p) => p._id);
					}

					const filter = scopeFilter(
						{
							deleted,
							...(query.active && { is_active: query.active === "true" }),
							...(patientIds && { patient: { $in: patientIds } }),
						},
						user,
					);

					const [list, total] = await Promise.all([
						IvrCallRequest.find(filter)
							.populate(patientPopulate)
							.skip(page * size)
							.limit(size)
							.sort({ is_active: -1, createdAt: -1 })
							.lean(),
						IvrCallRequest.countDocuments(filter),
					]);

					return R(`${schema.meta.name} list data`, list, true, {
						pages: Math.ceil(total / size),
						total,
						page,
						size,
					});
				},
				schema.list,
			)
			.get(
				"/insight",
				async ({ user }) => {
					const scope = scopeFilter({ deleted: false }, user);
					const startOfDay = moment().startOf("day").toDate();

					const [active, today, todayNewPatients] = await Promise.all([
						IvrCallRequest.countDocuments({ ...scope, is_active: true }),
						IvrCallRequest.countDocuments({
							...scope,
							createdAt: { $gte: startOfDay },
						}),
						IvrCallRequest.countDocuments({
							...scope,
							is_new_patient: true,
							createdAt: { $gte: startOfDay },
						}),
					]);

					return R(`${schema.meta.name} insight`, {
						active,
						today,
						today_new_patients: todayNewPatients,
					});
				},
				schema.insight,
			)
			.put(
				"/",
				async ({ body, query, user }) => {
					const entry = await IvrCallRequest.findOneAndUpdate(
						scopeFilter({ _id: query.id }, user),
						{ note: body.note ?? "" },
						{ new: true },
					)
						.populate(patientPopulate)
						.lean();

					if (!entry) return customError("Invalid entry");
					return R("entry updated", entry);
				},
				schema.update,
			)
			.put(
				"/end",
				async ({ query, user }) => {
					const existing = await IvrCallRequest.findOne(
						scopeFilter({ _id: query.id }, user),
					).lean();
					if (!existing) return customError("Invalid entry");

					// Already ended (webhook arrived or someone else ended it): no-op.
					if (!existing.is_active) {
						const entry = await IvrCallRequest.findById(existing._id)
							.populate(patientPopulate)
							.lean();
						return R("call already ended", entry);
					}

					const endedAt = new Date();
					const entry = await IvrCallRequest.findByIdAndUpdate(
						existing._id,
						{
							is_active: false,
							status: "ended-manually",
							ended_at: endedAt,
							...(!existing.duration && {
								duration: Math.round(
									(endedAt.getTime() - new Date((existing as any).createdAt).getTime()) / 1000,
								),
							}),
						},
						{ new: true },
					)
						.populate(patientPopulate)
						.lean();

					return R("call ended", entry);
				},
				schema.end,
			)
			.get(
				"/detail",
				async ({ query, user }) => {
					const entry = await IvrCallRequest.findOne(
						scopeFilter({ _id: query.id }, user),
					)
						.populate(patientPopulate)
						.lean();

					if (!entry) return customError("Invalid entry");
					return R("entry detail", entry);
				},
				schema.detail,
			)
			.delete(
				"/",
				async ({ query, user }) => {
					const entry = await IvrCallRequest.findOne(
						scopeFilter({ _id: query.id }, user),
					);

					if (entry) {
						entry.deleted = !entry.deleted;
						await entry.save();
					}

					return R("entry deleted", entry);
				},
				schema.delete,
			),
);
