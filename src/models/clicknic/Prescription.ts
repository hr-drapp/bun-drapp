import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { ClinicClass } from "./Clinic";
import { TenantClass } from "./Tenant";
import { PatientClass } from "./Patient";
import { DoctorClass } from "./Doctor";
import { AppointmentClass } from "./Appointment";

export interface PrescriptionDrug {
	name: string;
	dose: string;
	frequency: string;
	duration: string;
	instructions: string;
}

export interface PrescriptionInvestigation {
	name: string;
	notes?: string;
}

@modelOptions({
	schemaOptions: { collection: "prescription", timestamps: true },
})
export class PrescriptionClass {
	@prop({ ref: () => ClinicClass })
	public clinic!: Ref<ClinicClass>;

	@prop({ ref: () => TenantClass })
	public tenant!: Ref<TenantClass>;

	@prop({ ref: () => PatientClass })
	public patient!: Ref<PatientClass>;

	@prop({ ref: () => DoctorClass })
	public doctor!: Ref<DoctorClass>;

	@prop({ ref: () => AppointmentClass })
	public appointment!: Ref<AppointmentClass>;

	@prop({ type: () => [Object], default: [] })
	public drugs!: PrescriptionDrug[];

	@prop({ type: () => [Object], default: [] })
	public investigations!: PrescriptionInvestigation[];

	@prop({ default: false })
	public deleted!: boolean;
}

export default getModelForClass(PrescriptionClass);
