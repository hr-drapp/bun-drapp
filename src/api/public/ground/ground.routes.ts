import { randomUUID } from "crypto";
import { isValidObjectId } from "mongoose";
import { R } from "src/utils/response-helpers";
import { createElysia } from "src/utils/createElysia";
import { customError } from "src/utils/AppErr";
import schema from "./ground.schema";
import Clinic from "src/models/clicknic/Clinic";
import Volunteer from "src/models/clicknic/Volunteer";
import Village from "src/models/clicknic/Village";
import Patient from "src/models/clicknic/Patient";

/**
 * Public "ground team" form API. No admin login: a volunteer registers once
 * with name + phone and gets a device token (kept in localStorage) that must
 * be sent as `x-volunteer-token` on every other call. All writes are scoped to
 * the volunteer's clinic/tenant.
 */

const TOKEN_HEADER = "x-volunteer-token";

/** Keep the last 10 digits; Indian mobiles start with 6-9. */
const normalizePhone = (raw: string) => {
	const digits = `${raw ?? ""}`.replace(/\D/g, "").slice(-10);
	return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toJSON = <T>(doc: T): any => JSON.parse(JSON.stringify(doc));

/** `c` may be the clinic's numeric id or its _id; falls back to the default clinic. */
const resolveClinic = async (c?: string) => {
	if (c) {
		const byKey = isValidObjectId(c)
			? await Clinic.findById(c).lean()
			: /^\d+$/.test(c)
				? await Clinic.findOne({ id: Number(c) }).lean()
				: null;
		if (byKey) return byKey;
	}
	return (
		(await Clinic.findOne({ default: true }).lean()) ??
		(await Clinic.findOne().sort({ createdAt: 1 }).lean())
	);
};

const clinicView = (clinic: any) => ({
	_id: String(clinic._id),
	id: clinic.id,
	name: clinic.name,
	logo: clinic.logo,
});

const patientView = (p: any) => ({
	_id: String(p._id),
	id: p.id,
	name: p.name,
	phone: p.phone,
	age: p.age,
	gender: p.gender,
	village:
		p.village && typeof p.village === "object"
			? { _id: String(p.village._id), id: p.village.id, name: p.village.name }
			: (p.village ?? null),
	createdAt: new Date(p.createdAt).toISOString(),
});

const startOfToday = () => {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
};

export default createElysia({ prefix: schema.meta.name }).guard(
	{ detail: { tags: ["public-ground"] } },
	(app) =>
		app
			.get(
				"/clinic",
				async ({ query }) => {
					const clinic = await resolveClinic(query.c);
					if (!clinic) return customError("क्लिनिक नहीं मिला");
					return R("clinic", clinicView(clinic));
				},
				schema.clinic,
			)
			.post(
				"/volunteer",
				async ({ body }) => {
					const phone = normalizePhone(body.phone);
					if (!phone) return customError("सही 10 अंकों का मोबाइल नंबर डालें");

					const clinic = await resolveClinic(body.c);
					if (!clinic) return customError("क्लिनिक नहीं मिला");

					// Same phone again (new phone / cleared browser) → same volunteer, same token.
					let volunteer = await Volunteer.findOne({
						clinic: clinic._id,
						phone,
					}).select("+token");

					if (volunteer?.deleted) {
						return customError("आपका खाता बंद है, क्लिनिक से संपर्क करें");
					}

					if (volunteer) {
						volunteer.name = body.name.trim();
						volunteer.last_active_at = new Date();
						await volunteer.save();
					} else {
						volunteer = await Volunteer.create({
							clinic: clinic._id,
							tenant: clinic.tenant,
							name: body.name.trim(),
							phone,
							token: randomUUID(),
							last_active_at: new Date(),
						});
					}

					return R("स्वागत है", {
						_id: String(volunteer._id),
						name: volunteer.name,
						phone: volunteer.phone,
						token: volunteer.token,
						clinic: clinicView(clinic),
					});
				},
				schema.register,
			)
			// Everything below needs the volunteer's device token.
			.derive(async ({ headers }) => {
				const token = (headers as Record<string, string | undefined>)[TOKEN_HEADER];
				const volunteer = token
					? await Volunteer.findOne({ token, deleted: false }).lean()
					: null;
				return { volunteer };
			})
			.onBeforeHandle(({ volunteer }) => {
				if (!volunteer) return R("दोबारा नाम और नंबर डालें", null, false);
			})
			.get(
				"/me",
				async ({ volunteer }) => {
					const v = volunteer!;
					const clinic = await Clinic.findById(v.clinic).lean();
					return R("me", {
						_id: String(v._id),
						name: v.name,
						phone: v.phone,
						...(clinic && { clinic: clinicView(clinic) }),
					});
				},
				schema.me,
			)
			.get(
				"/villages",
				async ({ volunteer }) => {
					const v = volunteer!;
					const list = await Village.find({
						clinic: v.clinic,
						deleted: false,
					})
						.sort({ name: 1 })
						.lean();
					return R(
						"villages",
						list.map((x) => ({ _id: String(x._id), id: x.id, name: x.name })),
					);
				},
				schema.villages,
			)
			.post(
				"/village",
				async ({ body, volunteer }) => {
					const v = volunteer!;
					const name = body.name.trim().replace(/\s+/g, " ");
					// Reuse an existing village with the same name instead of duplicating it.
					const existing = await Village.findOne({
						clinic: v.clinic,
						deleted: false,
						name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
					}).lean();
					const village =
						existing ??
						toJSON(
							await Village.create({ name, clinic: v.clinic, tenant: v.tenant }),
						);
					return R("गाँव जुड़ गया", {
						_id: String(village._id),
						id: village.id,
						name: village.name,
					});
				},
				schema.createVillage,
			)
			.post(
				"/patient",
				async ({ body, volunteer }) => {
					const v = volunteer!;
					const phone = normalizePhone(body.phone);
					if (!phone) return customError("सही 10 अंकों का मोबाइल नंबर डालें");

					const name = body.name.trim().replace(/\s+/g, " ");

					let village: string | undefined;
					if (body.village) {
						if (!isValidObjectId(body.village)) return customError("गाँव सही नहीं है");
						const found = await Village.exists({
							_id: body.village,
							clinic: v.clinic,
						});
						if (!found) return customError("गाँव सही नहीं है");
						village = body.village;
					}

					// Double-tap / re-entry guard: same name + phone already in this clinic.
					const duplicate = await Patient.findOne({
						clinic: v.clinic,
						phone,
						deleted: false,
						name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
					})
						.populate("village")
						.lean();

					if (duplicate) {
						return R("यह मरीज़ पहले से जुड़ा है", {
							patient: patientView(duplicate),
							duplicate: true,
						});
					}

					const created = await Patient.create({
						name,
						phone,
						age: body.age,
						gender: body.gender,
						...(village && { village }),
						clinic: v.clinic,
						tenant: v.tenant,
						volunteer: v._id,
					});

					await Volunteer.updateOne(
						{ _id: v._id },
						{ last_active_at: new Date() },
					);

					const entry = await Patient.findById(created._id)
						.populate("village")
						.lean();

					return R("मरीज़ जुड़ गया", {
						patient: patientView(entry),
						duplicate: false,
					});
				},
				schema.createPatient,
			)
			.get(
				"/my-patients",
				async ({ volunteer }) => {
					const v = volunteer!;
					const base = { volunteer: v._id, deleted: false };
					const [today, total, recent] = await Promise.all([
						Patient.countDocuments({
							...base,
							createdAt: { $gte: startOfToday() },
						}),
						Patient.countDocuments(base),
						Patient.find(base)
							.populate("village")
							.sort({ createdAt: -1 })
							.limit(10)
							.lean(),
					]);
					return R("my patients", {
						today,
						total,
						recent: recent.map(patientView),
					});
				},
				schema.myPatients,
			),
);
