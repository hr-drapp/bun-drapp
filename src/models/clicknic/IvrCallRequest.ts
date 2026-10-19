import {
	prop,
	getModelForClass,
	modelOptions,
	index,
} from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { ClinicClass } from "./Clinic";
import { TenantClass } from "./Tenant";
import { PatientClass } from "./Patient";

/** Bolna execution statuses that mean the call is still live. */
export const IVR_ACTIVE_STATUSES = [
	"queued",
	"initiated",
	"ringing",
	"in-progress",
];

/** A call with no status update for this long is treated as ended. */
export const IVR_ACTIVE_TIMEOUT_MINUTES = 30;

@index({ execution_id: 1 }, { unique: true })
@index({ clinic: 1, tenant: 1, createdAt: -1 })
@modelOptions({
	schemaOptions: { collection: "ivr_call_request", timestamps: true },
})
export class IvrCallRequestClass {
	@prop({ ref: () => ClinicClass })
	public clinic!: Ref<ClinicClass>;

	@prop({ ref: () => TenantClass })
	public tenant!: Ref<TenantClass>;

	@prop({ ref: () => PatientClass })
	public patient!: Ref<PatientClass>;

	/** Caller number exactly as Bolna sent it (e.g. +919876543210). */
	@prop({})
	public contact_number!: string;

	@prop({})
	public agent_id!: string;

	@prop({ required: true })
	public execution_id!: string;

	/** Raw Bolna execution status (in-progress, completed, busy, ...). */
	@prop({ default: "in-progress" })
	public status!: string;

	@prop({ default: true })
	public is_active!: boolean;

	/** True when this call registered the patient for the first time. */
	@prop({ default: false })
	public is_new_patient!: boolean;

	@prop({ default: "" })
	public note!: string;

	/** Call duration in seconds, filled from Bolna's status webhook. */
	@prop({})
	public duration?: number;

	@prop({})
	public recording_url?: string;

	@prop({})
	public summary?: string;

	@prop({})
	public transcript?: string;

	@prop({})
	public ended_at?: Date;

	@prop({ default: false })
	public deleted!: boolean;
}

export default getModelForClass(IvrCallRequestClass);
