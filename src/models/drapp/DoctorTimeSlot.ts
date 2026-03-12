import {
	prop,
	getModelForClass,
	modelOptions,
	index,
	pre,
} from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import moment from "moment";
import { ClinicClass } from "./Clinic";
import { TenantClass } from "./Tenant";
import { GetAutoIncrId } from "src/utils/common";
import { AutoIncIdModel } from "./AutoIncementalId";
import { DoctorClass } from "./Doctor";

export enum DoctorSlotStatus {
	RESULT_PENDING = 0,
	RESULT_IN_PROGRESS = 1,
}
@pre<DoctorTimeSlotClass>("save", async function (next) {
	if (!this.id) {
		this.id = await GetAutoIncrId(AutoIncIdModel.CLINIC);
	}

	next();
})
@modelOptions({
	schemaOptions: { collection: "doctor_time_slot", timestamps: true },
})
export class DoctorTimeSlotClass {
	@prop({})
	public id!: number;

	@prop({ ref: () => ClinicClass })
	public clinic!: Ref<ClinicClass>;

	@prop({ ref: () => TenantClass })
	public tenant!: Ref<TenantClass>;

	@prop({ ref: () => DoctorClass })
	public doctor!: Ref<DoctorClass>;

	@prop({})
	public start!: number; // in minutes. Ex: 00:00 => 0, 01:00 => 60

	@prop({})
	public end!: number; // in minutes. Ex: 00:00 => 0, 01:00 => 60

	@prop({ default: DoctorSlotStatus.RESULT_PENDING })
	public status!: number;

	@prop({ default: false })
	public deleted?: boolean;
}

export default getModelForClass(DoctorTimeSlotClass);
