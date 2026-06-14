import { R } from "src/utils/response-helpers";
import schema from "./prescription.schema";
import Prescription from "src/models/clicknic/Prescription";
import { createElysia } from "src/utils/createElysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { ModuleId, Summary } from "src/config/modules";
import { normalizeQuery } from "src/utils/access-grants";

export default createElysia({ prefix: schema.meta.name }).guard(
	{
		detail: { tags: [schema.meta.name], summary: Summary([schema.meta.module]) },
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.put(
				"/",
				async ({ body, user }) => {
					const filter = normalizeQuery({ appointment: body.appointment }, user);
					const entry = await Prescription.findOneAndUpdate(
						filter,
						{ ...body, clinic: user.clinic, tenant: user.tenant },
						{ upsert: true, new: true },
					);
					return R("prescription saved", entry);
				},
				schema.upsert,
			)

			.get(
				"/by-appointment",
				async ({ query, user }) => {
					const filter = normalizeQuery({ appointment: query.appointment }, user);
					const entry = await Prescription.findOne(filter).lean();
					return R("prescription data", entry);
				},
				schema.byAppointment,
			),
);
