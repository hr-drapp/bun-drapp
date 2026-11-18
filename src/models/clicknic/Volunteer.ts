import {
	prop,
	getModelForClass,
	modelOptions,
	index,
} from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { ClinicClass } from "./Clinic";
import { TenantClass } from "./Tenant";

/**
 * Ground-team member who registers patients door to door from the public
 * form. Self-registered (name + phone); the `token` is a lightweight device
 * key kept in the browser's localStorage, not a real login.
 */
@index({ clinic: 1, phone: 1 }, { unique: true })
@index({ token: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: "volunteer", timestamps: true } })
export class VolunteerClass {
	@prop({ ref: () => ClinicClass })
	public clinic!: Ref<ClinicClass>;

	@prop({ ref: () => TenantClass })
	public tenant!: Ref<TenantClass>;

	@prop({ required: true, trim: true })
	public name!: string;

	@prop({ required: true, trim: true })
	public phone!: string;

	@prop({ required: true, select: false })
	public token!: string;

	@prop({})
	public last_active_at?: Date;

	@prop({ default: false })
	public deleted!: boolean;
}

export default getModelForClass(VolunteerClass);
