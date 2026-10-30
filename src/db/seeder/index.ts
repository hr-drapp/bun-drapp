import { consola } from "consola";
import moment from "moment";
import { ModuleId } from "src/config/modules";
import Admin, { AdminClass } from "src/models/clicknic/Admin";
import Clinic, { ClinicClass } from "src/models/clicknic/Clinic";
import Doctor from "src/models/clicknic/Doctor";
import Patient from "src/models/clicknic/Patient";
import Role, {
	RoleLevel,
	RoleClass,
	Permission,
	AbilitiMap,
} from "src/models/clicknic/Role";
import Tenant, { TenantClass } from "src/models/clicknic/Tenant";
import { HashPassword } from "src/utils/auth";

const tenantPayload: TenantClass = {
	name: "Dr Arjun",
	default: true,
};

const clinicPayload: ClinicClass = {
	name: "clicknic Clinic",
	logo: "https://clicknic.me/assets/images/logo.svg",
	default: true,
	domain: "clicknic.site",
	tenant: undefined as any,
	id: undefined as any,
};

/** Bolna IVR agent attached to every seeded clinic. */
const DEFAULT_IVR_AGENT_ID = "724f62ec-3dc4-41c9-b2ad-a58756231b09";

const DOCTOR_PROFILE_PIC = "https://clicknic.me/assets/images/logo.svg";

const { READ, CREATE, UPDATE, DELETE } = AbilitiMap;
const FULL_PERMISSION = [READ, CREATE, UPDATE, DELETE];

const superAdminPermissions: Permission = {
	[ModuleId.DASHBOARD]: {
		ability: FULL_PERMISSION,
	},
};
const superAdminRole: RoleClass = {
	level: RoleLevel.L1,
	name: "SUPER ADMIN",
	order: 1,
	permissions: superAdminPermissions,
	super_admin: true,
	total_admins: 0,
};
const superAdmin: Partial<AdminClass> = {
	name: "Super Admin",
	clinic: undefined,
	tenant: undefined,
	email: "super@clicknic.site",
	phone: "9982615247",
	password: "Admin@123",
};

const doctorPermissions: Permission = {
	[ModuleId.DASHBOARD]: {
		ability: FULL_PERMISSION,
	},
};
const doctorRole: RoleClass = {
	level: RoleLevel.L2,
	name: "DOCTOR",
	order: 1,
	permissions: doctorPermissions,
	super_admin: true,
	total_admins: 0,
};
/**
 * Doctors taking Knowlarity IVR calls, seeded into the default clinic. The
 * phone is both the login and the agent number Knowlarity bridges to, so each
 * doctor's IVR dashboard shows only the calls routed to them.
 */
const IVR_DOCTORS = [
	{ name: "Dr Madhu", email: "madhu@clicknic.site", phone: "7827981356" },
	{ name: "Dr Vrenda", email: "vrenda@clicknic.site", phone: "9811855974" },
] as const;

/** Doctors earlier seeder versions created; retired so only IVR_DOCTORS remain. */
const RETIRED_DOCTOR = { name: "Dr Arjun", phone: "9982615248" };

const receptionistPermissions: Permission = {
	[ModuleId.DASHBOARD]: {
		ability: FULL_PERMISSION,
	},
};
const receptionistRole: RoleClass = {
	level: RoleLevel.L3,
	name: "RECEPTIONIST",
	order: 1,
	permissions: receptionistPermissions,
	super_admin: true,
	total_admins: 0,
};
const receptionist: Partial<AdminClass> = {
	name: "ANITA",
	clinic: undefined,
	tenant: undefined,
	email: "anita@clicknic.site",
	phone: "9982615249",
	password: "Admin@123",
};

const DEFAULT_SEED_PASSWORD = "Admin@123";

type PrimaryCred = {
	email?: string;
	phone?: string;
	password?: string;
};

type SeededClinicLog = {
	clinic: string;
	domain: string;
	primary: PrimaryCred;
};

const formatClinicCredentialLog = (clinics: SeededClinicLog[]) =>
	[
		"",
		"Seeded clinic credentials",
		...clinics.flatMap((clinic) => [
			`- ${clinic.clinic}`,
			`  domain: ${clinic.domain}`,
			`  email: ${clinic.primary.email || "-"}`,
			`  phone: ${clinic.primary.phone || "-"}`,
			`  password: ${clinic.primary.password || "-"}`,
		]),
	].join("\n");

const logSeederCredentials = (clinics: SeededClinicLog[]) => {
	if (process.env.APP_ENV !== "development") {
		return;
	}

	consola.box(formatClinicCredentialLog(clinics));
};

/**
 * Keeps a single tenant + clinic: every other clinic and tenant is deleted with
 * its admins and doctors. In the default clinic only the old seeded doctor
 * (Dr Arjun / DOC login) is retired, so doctors added from the dashboard stay.
 */
const removeOtherClinicsAndDoctors = async (tenantId: any, clinicId: any) => {
	const otherClinics = await Clinic.find({ _id: { $ne: clinicId } }, { _id: 1 }).lean();
	const otherClinicIds = otherClinics.map((c) => c._id);

	await Promise.all([
		Admin.deleteMany({ clinic: { $in: otherClinicIds } }),
		Doctor.deleteMany({ clinic: { $in: otherClinicIds } }),
		Clinic.deleteMany({ _id: { $in: otherClinicIds } }),
		Tenant.deleteMany({ _id: { $ne: tenantId } }),
		Doctor.updateMany(
			{ clinic: clinicId, name: RETIRED_DOCTOR.name, deleted: false },
			{ $set: { deleted: true } },
		),
		Admin.updateMany(
			{ phone: RETIRED_DOCTOR.phone, deleted: false },
			{ $set: { deleted: true } },
		),
	]);

	if (otherClinicIds.length) {
		consola.info(`Seeder removed ${otherClinicIds.length} other clinic(s)`);
	}
};

// TENANT->CLINIC->ROLES->ADMINS->DOCTOR

/** Number registered as a patient so Knowlarity can test the "registered" IVR flow. */
const KNOWLARITY_TEST_PATIENT = {
	name: "Knowlarity Test Patient",
	phone: "9711374160",
	age: 30,
	gender: 1,
};

/**
 * Registers the Knowlarity test number in the same clinic /get-agent looks up
 * (the default one). Created through Patient.create so the auto-increment id
 * is assigned; skipped when a patient with this number already exists.
 */
export const seedKnowlarityTestPatient = async () => {
	const clinic = await Clinic.findOne({ default: true }).lean();
	if (!clinic) return null;

	const scope = { clinic: clinic._id, tenant: clinic.tenant };
	const { phone } = KNOWLARITY_TEST_PATIENT;
	const existing = await Patient.findOne({
		...scope,
		phone: { $in: [phone, `0${phone}`, `91${phone}`, `+91${phone}`] },
		deleted: false,
	}).lean();
	if (existing) return existing;

	return Patient.create({
		...scope,
		...KNOWLARITY_TEST_PATIENT,
		profile_pic: "",
	});
};

export const seeder = async () => {
	// 1. Tenant
	const tenant = await Tenant.findOneAndUpdate(
		{ default: true },
		{ $set: tenantPayload },
		{ upsert: true, new: true },
	);

	// 2. Clinic
	clinicPayload.tenant = tenant._id;
	const clinic = await Clinic.findOneAndUpdate(
		{ domain: clinicPayload.domain, tenant: tenant._id },
		{
			$set: clinicPayload,
			$addToSet: { ivr_agent_ids: DEFAULT_IVR_AGENT_ID },
		},
		{ upsert: true, new: true },
	);

	// 3. Roles
	const superAdminRoleDoc = await Role.findOneAndUpdate(
		{ name: superAdminRole.name },
		{ $set: superAdminRole },
		{ upsert: true, new: true },
	);

	const doctorRoleDoc = await Role.findOneAndUpdate(
		{ name: doctorRole.name },
		{ $set: doctorRole },
		{ upsert: true, new: true },
	);

	const receptionistRoleDoc = await Role.findOneAndUpdate(
		{ name: receptionistRole.name },
		{ $set: receptionistRole },
		{ upsert: true, new: true },
	);

	// 4. Admins
	const hashedPassword = HashPassword(superAdmin.password!);

	const superAdminDoc = await Admin.findOneAndUpdate(
		{ phone: superAdmin.phone },
		{
			$set: {
				name: superAdmin.name,
				email: superAdmin.email,
				phone: superAdmin.phone,
				password: hashedPassword,
				role: superAdminRoleDoc._id,
				role_id: superAdminRoleDoc._id.toString(),
				super_admin: true,
				permissions: superAdminPermissions,
				tenant: tenant._id,
				clinic: clinic._id,
			},
		},
		{ upsert: true, new: true },
	);

	await Admin.findOneAndUpdate(
		{ phone: receptionist.phone },
		{
			$set: {
				name: receptionist.name,
				email: receptionist.email,
				phone: receptionist.phone,
				password: HashPassword(receptionist.password!),
				role: receptionistRoleDoc._id,
				role_id: receptionistRoleDoc._id.toString(),
				super_admin: false,
				permissions: receptionistPermissions,
				parent: superAdminDoc._id,
				tenant: tenant._id,
				clinic: clinic._id,
			},
		},
		{ upsert: true, new: true },
	);

	// 5. Doctors (IVR call handlers), each with a DOCTOR login
	for (const ivrDoctor of IVR_DOCTORS) {
		await Doctor.findOneAndUpdate(
			{ name: ivrDoctor.name, tenant: tenant._id, clinic: clinic._id },
			{
				$set: {
					name: ivrDoctor.name,
					profile_pic: DOCTOR_PROFILE_PIC,
					tenant: tenant._id,
					clinic: clinic._id,
					deleted: false,
				},
			},
			{ upsert: true, new: true },
		);

		// Admin.doctor is left unset on purpose: normalizeQuery would then scope
		// patients/doctors/media by doctor and those models have no doctor field.
		await Admin.findOneAndUpdate(
			{ phone: ivrDoctor.phone },
			{
				$set: {
					name: ivrDoctor.name,
					email: ivrDoctor.email,
					phone: ivrDoctor.phone,
					password: HashPassword(DEFAULT_SEED_PASSWORD),
					role: doctorRoleDoc._id,
					role_id: doctorRoleDoc._id.toString(),
					super_admin: false,
					permissions: doctorPermissions,
					parent: superAdminDoc._id,
					tenant: tenant._id,
					clinic: clinic._id,
					deleted: false,
				},
			},
			{ upsert: true, new: true },
		);
	}

	await removeOtherClinicsAndDoctors(tenant._id, clinic._id);

	// Update total_admins count on roles
	const [superAdminCount, doctorCount, receptionistCount] = await Promise.all([
		Admin.countDocuments({ role: superAdminRoleDoc._id }),
		Admin.countDocuments({ role: doctorRoleDoc._id }),
		Admin.countDocuments({ role: receptionistRoleDoc._id }),
	]);
	await Promise.all([
		Role.updateOne(
			{ _id: superAdminRoleDoc._id },
			{ total_admins: superAdminCount },
		),
		Role.updateOne({ _id: doctorRoleDoc._id }, { total_admins: doctorCount }),
		Role.updateOne(
			{ _id: receptionistRoleDoc._id },
			{ total_admins: receptionistCount },
		),
	]);

	await seedKnowlarityTestPatient();

	logSeederCredentials([
		{
			clinic: clinicPayload.name,
			domain: clinicPayload.domain,
			primary: {
				email: superAdmin.email,
				phone: superAdmin.phone,
				password: superAdmin.password,
			},
		},
		...IVR_DOCTORS.map((ivrDoctor) => ({
			clinic: `${clinicPayload.name} · ${ivrDoctor.name}`,
			domain: clinicPayload.domain,
			primary: {
				email: ivrDoctor.email,
				phone: ivrDoctor.phone,
				password: DEFAULT_SEED_PASSWORD,
			},
		})),
	]);

	console.log("Seeder completed successfully");
	return true;
};
