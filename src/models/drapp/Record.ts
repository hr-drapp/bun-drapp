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
import { TenantClass } from "../Tenant";
import { PatientClass } from "./Patient";
import { DoctorClass } from "./Doctor";
import { DoctorSlotClass } from "./DoctorSlot";
import { AppointmentClass } from "./Appointment";

export enum RecordStatus {
	PENDING = 0,
	COMPLETED = 1,
	CANCELLED = 2,
}

@pre<RecordClass>("save", async function (next) {
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
	schemaOptions: { collection: "record", timestamps: true },
})
export class RecordClass {
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

	@prop({ default: RecordStatus.PENDING })
	public status!: number;

	@prop({ default: RecordStatus.PENDING })
	public type!: number;

	@prop({ default: [] })
	public attachments!: string[];

	@prop({ default: false })
	public deleted!: boolean;
}

export default getModelForClass(RecordClass);
