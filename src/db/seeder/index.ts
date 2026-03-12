import moment from "moment";
import { ModuleId } from "src/config/modules";
import Admin, { AdminClass } from "src/models/drapp/Admin";
import Clinic, { ClinicClass } from "src/models/drapp/Clinic";
import Doctor, { DoctorClass } from "src/models/drapp/Doctor";
import Role, {
	RoleLevel,
	RoleClass,
	Permission,
	AbilitiMap,
} from "src/models/drapp/Role";
import Tenant, { TenantClass } from "src/models/drapp/Tenant";
import { HashPassword } from "src/utils/auth";

const tenantPayload: TenantClass = {
	name: "Dr Arjun",
	default: true,
};

const clinicPayload: ClinicClass = {
	name: "Drapp Clinic",
	logo: "https://drapp.me/assets/images/logo.svg",
	default: true,
	domain: "drapp.com",
	tenant: undefined as any,
	id: undefined as any,
};

const doctorPayload: DoctorClass = {
	name: "Dr Arjun",
	profile_pic: "https://drapp.me/assets/images/logo.svg",
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
	email: "super@drapp.com",
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
	email: "doc@drapp.com",
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
	email: "anita@drapp.com",
	phone: "9982615249",
	password: "Admin@123",
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

	console.log("Seeder completed successfully");
	return true;
};
