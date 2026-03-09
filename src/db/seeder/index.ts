import moment from "moment";
import { ModuleId } from "src/config/modules";
import Admin, { AdminClass } from "src/models/drapp/Admin";
import Clinic from "src/models/drapp/Clinic";
import Role, { RoleLevel, RoleClass } from "src/models/drapp/Role";
import Tenant from "src/models/drapp/Tenant";
import { HashPassword } from "src/utils/auth";

export const seeder = async () => {
	getDefaultClinic();
	let superAdminRole = await Role.findOne({
		name: "SUPER ADMIN",
		super_admin: true,
	});

	if (!superAdminRole) {
		superAdminRole = await Role.create({
			name: "SUPER ADMIN",
			super_admin: true,
			order: 1,
			level: RoleLevel.L1,
		});
	}
	//

	let tenant = await Tenant.findOne({
		name: "Super Admin",
	});

	if (!tenant) {
		tenant = await Tenant.create({
			name: "Super Admin",
			default: true,
		});
	}

	let superAdmin = await Admin.findOne({
		phone: "superadmin",
	});

	if (!superAdmin) {
		superAdmin = await Admin.create({
			name: "Super Admin",
			password: HashPassword("Admin@123"),
			phone: "superadmin",
			role: superAdminRole.id,
			super_admin: true,
			email: "harsh@gmail.com",
			tenant: tenant._id,
		});
	}

	let testSuperAdmin = await Admin.findOne({
		phone: "testadmin",
	});

	if (!testSuperAdmin) {
		testSuperAdmin = await Admin.create({
			name: "Test Super Admin",
			password: HashPassword("Admin@123"),
			phone: "testadmin",
			role: superAdminRole.id,
			super_admin: true,
			email: "test@gmail.com",
		});
	}

	// superAdmin.email = "vinodkumarswami1991@gmail.com"
	// await superAdmin.save();
	/** */
	let masterRole = await Role.findOne({
		name: "MASTER",
		super_admin: false,
	});

	if (!masterRole) {
		masterRole = await Role.create({
			name: "MASTER",
			super_admin: false,
			order: 2,
			level: RoleLevel.L2,
			permissions: {
				[ModuleId.DASHBOARD]: {
					ability: [1, 2, 3, 4],
				},
				[ModuleId.ROLES_AND_PERMISSIONS]: {
					ability: [1, 2, 3, 4],
				},
			},
		});
	}

	// let masterAdmin = await Admin.findOne({
	// 	phone: "master_1",
	// 	role: masterRole._id,
	// });

	// if (!masterAdmin) {
	// 	masterAdmin = await Admin.create({
	// 		name: "Master",
	// 		password: HashPassword("Admin@123"),
	// 		password_unhashed: "Admin@123",
	// 		phone: "master_1",
	// 		role: masterRole._id,
	// 		super_admin: false,
	// 		parent: superAdmin._id,
	// 		email: "master1@gmail.com",
	// 	});
	// }
	/** */
	let teamMemberRole = await Role.findOne({
		name: "TEAM MEMBER",
		super_admin: false,
	});

	if (!teamMemberRole) {
		teamMemberRole = await Role.create({
			name: "TEAM MEMBER",
			super_admin: false,
			order: 3,
			level: RoleLevel.L3,
			permissions: {
				1: {
					ability: [1, 2, 3, 4],
				},
				3: {
					ability: [1, 2, 3, 4],
				},
				4: {
					ability: [1, 2, 3, 4],
				},
				5: {
					ability: [1, 2, 3, 4],
				},
			},
		});
	}

	// let teamMemberAdmin = await Admin.findOne({
	// 	phone: "team_member_1",
	// 	role: teamMemberRole._id,
	// });

	// if (!teamMemberAdmin) {
	// 	teamMemberAdmin = await Admin.create({
	// 		name: "Team Member",
	// 		password: HashPassword("Admin@123"),
	// 		password_unhashed: "Admin@123",
	// 		phone: "team_member_1",
	// 		role: teamMemberRole._id,
	// 		super_admin: false,
	// 		parent: masterAdmin._id,
	// 		email: "teammember1@gmail.com",
	// 	});
	// }
	/** */

	return true;
};

const clinicPayload = {
	name: "Drapp Clinic",
	logo: "https://drapp.me/assets/images/logo.svg",
	default: true,
};
export const getDefaultClinic = async () => {
	let clinic = await Clinic.findOne({ default: true });

	if (!clinic) {
		clinic = await Clinic.create(clinicPayload);
	} else {
		clinic.name = clinicPayload.name;
		clinic.logo = clinicPayload.logo;
		clinic.default = clinicPayload.default;
		await clinic.save();
	}

	return clinic;
};
