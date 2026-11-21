import moment from "moment";
import { R } from "src/utils/response-helpers";
import schema from "./ivr-break.schema";
import Admin from "src/models/clicknic/Admin";
import IvrBreak from "src/models/clicknic/IvrBreak";
import { RoleLevel } from "src/models/clicknic/Role";
import { createElysia } from "src/utils/createElysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { Summary } from "src/config/modules";
import { normalizeQuery } from "src/utils/access-grants";

const adminPopulate = { path: "admin", select: "_id name phone" };

/** Doctor logins see only their own breaks; owners/staff see the clinic. */
const isDoctorLogin = (user: any) =>
	!user?.super_admin && user?.role?.level === RoleLevel.L2;

/** Clinic/tenant scope (no doctor key: breaks belong to admins, not doctors). */
const scope = (user: any) => {
	const { doctor, ...filter } = normalizeQuery({}, user) as any;
	return filter as { tenant: any; clinic: any };
};

/** Dates and ObjectIds as strings, so the response schema accepts them. */
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const seconds = (from: Date, to: Date) =>
	Math.max(0, Math.round((to.getTime() - from.getTime()) / 1000));

/** Seconds of a break that fall inside [start, end); open breaks run to now. */
const overlap = (b: any, start: Date, end: Date, now: Date) => {
	const from = new Date(Math.max(new Date(b.started_at).getTime(), start.getTime()));
	const to = new Date(Math.min((b.ended_at ? new Date(b.ended_at) : now).getTime(), end.getTime()));
	return seconds(from, to);
};

/** Breaks that touch [start, end): started before end and not ended before start. */
const overlapFilter = (start: Date, end: Date) => ({
	started_at: { $lt: end },
	$or: [{ ended_at: { $exists: false } }, { ended_at: null }, { ended_at: { $gte: start } }],
});

const withLiveDuration = (b: any, now: Date) => ({
	...b,
	is_open: !b.ended_at,
	duration: b.ended_at ? b.duration : seconds(new Date(b.started_at), now),
});

/** The admin's on-break flag plus today's break total. */
const statusOf = async (adminId: any) => {
	const admin = await Admin.findById(adminId).select("ivr_on_break ivr_break_since").lean();
	const now = new Date();
	const start = moment().startOf("day").toDate();
	const end = moment().endOf("day").toDate();
	const breaks = await IvrBreak.find({ admin: adminId, ...overlapFilter(start, end) }).lean();
	return plain({
		on_break: !!admin?.ivr_on_break,
		break_since: admin?.ivr_on_break && admin?.ivr_break_since ? admin.ivr_break_since : null,
		today_seconds: breaks.reduce((sum, b) => sum + overlap(b, start, end, now), 0),
		today_count: breaks.length,
	});
};

/** Closes every open break of this admin (normally just one). */
const closeOpenBreaks = async (adminId: any, now: Date) => {
	const open = await IvrBreak.find({
		admin: adminId,
		$or: [{ ended_at: { $exists: false } }, { ended_at: null }],
	});
	for (const b of open) {
		b.ended_at = now;
		b.duration = seconds(b.started_at, now);
		await b.save();
	}
};

const dayRange = (date?: string) => {
	const day = date ? moment(date, "YYYY-MM-DD", true) : moment();
	const base = day.isValid() ? day : moment();
	return { start: base.clone().startOf("day").toDate(), end: base.clone().endOf("day").toDate() };
};

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
			.get("/status", async ({ user }) => R("ivr break status", await statusOf(user._id)), schema.status)
			.put(
				"/status",
				async ({ body, user }) => {
					const now = new Date();
					if (body.on_break) {
						// Conditional update: a double tap can't open two breaks.
						const started = await Admin.findOneAndUpdate(
							{ _id: user._id, ivr_on_break: { $ne: true } },
							{ ivr_on_break: true, ivr_break_since: now },
						).lean();
						if (started) {
							await closeOpenBreaks(user._id, now);
							await IvrBreak.create({
								admin: user._id,
								clinic: user.clinic,
								tenant: user.tenant,
								started_at: now,
							});
						}
					} else {
						await Admin.updateOne({ _id: user._id }, { ivr_on_break: false, $unset: { ivr_break_since: 1 } });
						await closeOpenBreaks(user._id, now);
					}
					const status = await statusOf(user._id);
					return R(status.on_break ? "on break, calls paused" : "online, taking calls", status);
				},
				schema.setStatus,
			)
			.get(
				"/",
				async ({ query, user }) => {
					const page = parseInt(query.page);
					const size = parseInt(query.size);
					const filter: Record<string, any> = { ...scope(user) };

					if (isDoctorLogin(user)) filter.admin = user._id;
					else if (query.admin) filter.admin = query.admin;

					if (query.from || query.to) {
						const start = query.from ? dayRange(query.from).start : new Date(0);
						const end = query.to ? dayRange(query.to).end : new Date();
						Object.assign(filter, overlapFilter(start, end));
					}

					const [list, total] = await Promise.all([
						IvrBreak.find(filter)
							.populate(adminPopulate)
							.skip(page * size)
							.limit(size)
							.sort({ started_at: -1 })
							.lean(),
						IvrBreak.countDocuments(filter),
					]);
					const now = new Date();
					return R(
						`${schema.meta.name} list data`,
						plain(list.map((b) => withLiveDuration(b, now))),
						true,
						{ pages: Math.ceil(total / size), total, page, size },
					);
				},
				schema.list,
			)
			.get(
				"/summary",
				async ({ query, user }) => {
					const { start, end } = dayRange(query.date);
					const now = new Date();

					const admins = (
						await Admin.find({
							...scope(user),
							deleted: false,
							super_admin: { $ne: true },
							...(isDoctorLogin(user) && { _id: user._id }),
						})
							.populate({ path: "role", select: "level" })
							.select("_id name phone role ivr_on_break ivr_break_since")
							.sort({ name: 1 })
							.lean()
					).filter((a: any) => a.role?.level === RoleLevel.L2);

					const breaks = await IvrBreak.find({
						admin: { $in: admins.map((a) => a._id) },
						...overlapFilter(start, end),
					}).lean();

					const data = admins.map((a: any) => {
						const own = breaks.filter((b) => `${b.admin}` === `${a._id}`);
						return {
							admin: { _id: a._id, name: a.name, phone: a.phone },
							on_break: !!a.ivr_on_break,
							break_since: a.ivr_on_break && a.ivr_break_since ? a.ivr_break_since : null,
							total_seconds: own.reduce((sum, b) => sum + overlap(b, start, end, now), 0),
							count: own.length,
						};
					});
					return R(`${schema.meta.name} summary`, plain(data));
				},
				schema.summary,
			),
);
