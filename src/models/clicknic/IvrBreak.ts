import {
	prop,
	getModelForClass,
	modelOptions,
	index,
} from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { AdminClass } from "./Admin";
import { ClinicClass } from "./Clinic";
import { TenantClass } from "./Tenant";

/**
 * One break a doctor took from IVR calls: from "Take a break" to "Back online".
 * Open break = ended_at not set. While open, Vobiz round robin skips the doctor.
 */
@index({ admin: 1, ended_at: 1 })
@index({ clinic: 1, tenant: 1, started_at: -1 })
@modelOptions({
	schemaOptions: { collection: "ivr_break", timestamps: true },
})
export class IvrBreakClass {
	@prop({ ref: () => AdminClass, required: true })
	public admin!: Ref<AdminClass>;

	@prop({ ref: () => ClinicClass })
	public clinic!: Ref<ClinicClass>;

	@prop({ ref: () => TenantClass })
	public tenant!: Ref<TenantClass>;

	@prop({ required: true })
	public started_at!: Date;

	@prop({ required: false })
	public ended_at?: Date;

	/** Break length in seconds, set when the break ends. */
	@prop({ required: false, default: 0 })
	public duration!: number;
}

export default getModelForClass(IvrBreakClass);
