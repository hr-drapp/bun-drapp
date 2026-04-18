import { consola } from "consola";
import moment from "moment";
import { ModuleId } from "src/config/modules";
import Admin, { AdminClass } from "src/models/clicknic/Admin";
import Clinic, { ClinicClass } from "src/models/clicknic/Clinic";
import Doctor, { DoctorClass } from "src/models/clicknic/Doctor";
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

const doctorPayload: DoctorClass = {
	name: "Dr Arjun",
	profile_pic: "https://clicknic.me/assets/images/logo.svg",
	pictures: [],
	tenant: undefined as any,
	clinic: undefined as any,
	id: undefined as any,
};

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
const doctor: Partial<AdminClass> = {
	name: "DOC",
	clinic: undefined,
	tenant: undefined,
	email: "doc@clicknic.site",
	phone: "9982615248",
	password: "Admin@123",
};

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

const DEFAULT_CLINIC_NAMES = ["manjima", "kirthi", "nobin", "krishna"] as const;

const DEFAULT_SEED_PASSWORD = "Admin@123";

const sanitizeClinicName = (clinicName: string) => clinicName.trim();

const slugifyClinicName = (clinicName: string) =>
	sanitizeClinicName(clinicName)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "") || "clinic";

const createSeedHash = (value: string) => {
	let hash = 0;

	for (const char of value) {
		hash = (hash * 31 + char.charCodeAt(0)) % 10000000;
	}

	return hash;
};

const buildSeedPhone = (clinicName: string, offset: number) => {
	const phoneBase = 6000000000;
	const hash = createSeedHash(slugifyClinicName(clinicName));

	return String(phoneBase + ((hash + offset) % 1000000000));
};

const buildClinicSeedCredentials = (clinicName: string) => {
	const slug = slugifyClinicName(clinicName);

	return {
		superAdmin: {
			name: "Super Admin",
			email: `super.${slug}@clicknic.site`,
			phone: buildSeedPhone(clinicName, 1),
			password: DEFAULT_SEED_PASSWORD,
		},
		doctor: {
			name: "DOC",
			email: `doc.${slug}@clicknic.site`,
			phone: buildSeedPhone(clinicName, 2),
			password: DEFAULT_SEED_PASSWORD,
		},
		receptionist: {
			name: "ANITA",
			email: `anita.${slug}@clicknic.site`,
			phone: buildSeedPhone(clinicName, 3),
			password: DEFAULT_SEED_PASSWORD,
		},
	};
};

const getOrCreateDefaultRoles = async () => {
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

	return {
		superAdminRoleDoc,
		doctorRoleDoc,
		receptionistRoleDoc,
	};
};

const syncRoleAdminCounts = async (roleIds: string[]) => {
	const counts = await Promise.all(
		roleIds.map((roleId) => Admin.countDocuments({ role: roleId })),
	);

	await Promise.all(
		roleIds.map((roleId, index) =>
			Role.updateOne({ _id: roleId }, { total_admins: counts[index] }),
		),
	);
};

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

// TENANT->CLINIC->ROLES->ADMINS->DOCTOR

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
		{ $set: clinicPayload },
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
		{ phone: doctor.phone },
		{
			$set: {
				name: doctor.name,
				email: doctor.email,
				phone: doctor.phone,
				password: HashPassword(doctor.password!),
				role: doctorRoleDoc._id,
				role_id: doctorRoleDoc._id.toString(),
				super_admin: false,
				permissions: doctorPermissions,
				parent: superAdminDoc._id,
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

	// 5. Doctor
	doctorPayload.tenant = tenant._id;
	doctorPayload.clinic = clinic._id;
	await Doctor.findOneAndUpdate(
		{ name: doctorPayload.name, tenant: tenant._id },
		{ $set: doctorPayload },
		{ upsert: true, new: true },
	);

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

	const seededClinics = await Promise.all(
		DEFAULT_CLINIC_NAMES.map((clinicName) => seedClinicDefaults(clinicName)),
	);

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
		...seededClinics.map((clinicData) => ({
			clinic: clinicData.clinic,
			domain: clinicData.domain,
			primary: {
				email: clinicData.credentials.superAdmin.email,
				phone: clinicData.credentials.superAdmin.phone,
				password: clinicData.credentials.superAdmin.password,
			},
		})),
	]);

	console.log("Seeder completed successfully");
	return true;
};

export const seedClinicDefaults = async (clinicName: string) => {
	const normalizedClinicName = sanitizeClinicName(clinicName);

	if (!normalizedClinicName) {
		throw new Error("clinicName is required");
	}

	const clinicSlug = slugifyClinicName(normalizedClinicName);
	const credentials = buildClinicSeedCredentials(normalizedClinicName);

	const tenant = await Tenant.findOneAndUpdate(
		{ name: normalizedClinicName },
		{
			$set: {
				name: normalizedClinicName,
				default: false,
			},
		},
		{ upsert: true, new: true },
	);

	const clinic = await Clinic.findOneAndUpdate(
		{ domain: `${clinicSlug}.clicknic.site`, tenant: tenant._id },
		{
			$set: {
				name: normalizedClinicName,
				logo: clinicPayload.logo,
				default: false,
				domain: `${clinicSlug}.clicknic.site`,
				tenant: tenant._id,
			},
		},
		{ upsert: true, new: true },
	);

	const { superAdminRoleDoc, doctorRoleDoc, receptionistRoleDoc } =
		await getOrCreateDefaultRoles();

	const superAdminDoc = await Admin.findOneAndUpdate(
		{ phone: credentials.superAdmin.phone },
		{
			$set: {
				name: credentials.superAdmin.name,
				email: credentials.superAdmin.email,
				phone: credentials.superAdmin.phone,
				password: HashPassword(credentials.superAdmin.password),
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
		{ phone: credentials.doctor.phone },
		{
			$set: {
				name: credentials.doctor.name,
				email: credentials.doctor.email,
				phone: credentials.doctor.phone,
				password: HashPassword(credentials.doctor.password),
				role: doctorRoleDoc._id,
				role_id: doctorRoleDoc._id.toString(),
				super_admin: false,
				permissions: doctorPermissions,
				parent: superAdminDoc._id,
				tenant: tenant._id,
				clinic: clinic._id,
			},
		},
		{ upsert: true, new: true },
	);

	await Admin.findOneAndUpdate(
		{ phone: credentials.receptionist.phone },
		{
			$set: {
				name: credentials.receptionist.name,
				email: credentials.receptionist.email,
				phone: credentials.receptionist.phone,
				password: HashPassword(credentials.receptionist.password),
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

	await Doctor.findOneAndUpdate(
		{ name: normalizedClinicName, tenant: tenant._id, clinic: clinic._id },
		{
			$set: {
				name: normalizedClinicName,
				profile_pic: doctorPayload.profile_pic,
				pictures: [],
				tenant: tenant._id,
				clinic: clinic._id,
			},
		},
		{ upsert: true, new: true },
	);

	await syncRoleAdminCounts([
		superAdminRoleDoc._id.toString(),
		doctorRoleDoc._id.toString(),
		receptionistRoleDoc._id.toString(),
	]);

	return {
		clinic: normalizedClinicName,
		tenantId: tenant._id,
		clinicId: clinic._id,
		domain: `${clinicSlug}.clicknic.site`,
		credentials,
	};
};
