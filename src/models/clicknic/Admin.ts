import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import Role, { RoleClass } from "./Role";
import { TenantClass } from "./Tenant";
import { ClinicClass } from "./Clinic";
import { DoctorClass } from "./Doctor";

@modelOptions({ schemaOptions: { collection: "admins", timestamps: true } })
export class AdminClass {
	@prop({})
	public name!: string;

	@prop({ unique: true })
	public phone!: string;

	@prop({ unique: true, required: false })
	public email?: string;

	@prop()
	public password!: string;

	@prop({ default: false })
	public password_changed!: boolean;

	@prop()
	public role_id!: string;

	@prop({ default: false })
	public super_admin!: boolean;

	@prop({ ref: () => RoleClass })
	public role!: Ref<RoleClass>;

	@prop({ ref: () => AdminClass })
	public parent!: Ref<AdminClass>;

	@prop({ ref: () => TenantClass })
	public tenant!: Ref<TenantClass>;

	@prop({ ref: () => ClinicClass })
	public clinic!: Ref<ClinicClass>;

	@prop({ ref: () => DoctorClass, required: false })
	public doctor?: Ref<DoctorClass>;

	@prop({ required: false })
	public expire_at!: Date;

	@prop({ required: false, default: 0 })
	public children_count!: number;

	@prop({ required: false, default: 0 })
	public admin_create_limit!: number;

	@prop({ required: false })
	public ip!: string;

	@prop({ required: false })
	public otp!: string;

	@prop({ default: {} })
	public permissions!: any;

	@prop({ required: false, default: "" })
	public default_type?: string;

	@prop({ default: false })
	public is_customer!: boolean;

	@prop({ default: false })
	public deleted!: boolean;

	@prop()
	public games?: string[];
}

export type Abilities = 1 | 2 | 3 | 4;

export type Ability = Abilities[];

export interface Permission {
	[module: number]: {
		ability: Ability;
	};
}

export default getModelForClass(AdminClass);
