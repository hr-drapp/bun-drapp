import {
	prop,
	getModelForClass,
	modelOptions,
	pre,
} from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import { GetAutoIncrId } from "src/utils/common";
import { AutoIncIdModel } from "./AutoIncementalId";
import { ClinicClass } from "./Clinic";
import { getDefaultClinic } from "src/db/seeder";
import { AdminClass } from "./Admin";
import { TenantClass } from "./Tenant";
import { PatientClass } from "./Patient";
import { DoctorClass } from "./Doctor";
import { DoctorTimeSlotClass } from "./DoctorTimeSlot";
import { AppointmentClass } from "./Appointment";

export enum PatientHealthRecordStatus {
	PENDING = 0,
	COMPLETED = 1,
	CANCELLED = 2,
}

export enum PatientHealthRecordType {
	VITALS = 0,
	OTHERS = 1,
}

export interface PatientHealthRecordValue {
	field: string;
	value:
		| string
		| number
		| boolean
		| Array<string | number | boolean>
		| Array<PatientHealthRecordValue>;
	remark?: string;
}

@pre<PatientHealthRecordClass>("save", async function (next) {
	if (!this.id) {
		this.id = await GetAutoIncrId(AutoIncIdModel.CLINIC);
	}

	if (!this.clinic) {
		const clinic = await getDefaultClinic();
		if (clinic) {
			this.clinic = clinic._id;
		}
	}
	next();
})
@modelOptions({
	schemaOptions: { collection: "patient_health_record", timestamps: true },
})
export class PatientHealthRecordClass {
	@prop({})
	public id!: number;

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

	@prop({ default: PatientHealthRecordStatus.PENDING })
	public status!: number;

	@prop({ default: PatientHealthRecordType.VITALS })
	public type!: number;

	@prop({ type: () => [Object], default: [] })
	public values!: PatientHealthRecordValue[];

	@prop({ default: [] })
	public attachments!: string[];

	@prop({ default: false })
	public deleted!: boolean;
}

export default getModelForClass(PatientHealthRecordClass);
