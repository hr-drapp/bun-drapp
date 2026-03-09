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

export enum AppointmentType {
	CONSULTATION = 0,
	REVISIT = 1,
	EMERGENCY = 2,
	VIP = 3,
}

export enum AppointmentSource {
	IN_APP = 0,
	WALK_IN = 1,
}

export enum AppointmentStatus {
	BOOKED = 0,
	IN_QUEUE = 1,
	IN_SESSION = 2,
	PAUSED = 3,
	COMPLETED = 4,
	CANCELLED = 5,
	ABSENT = 6,
	LEFT_WITHOUT_CONSULT = 7,
}

@pre<AppointmentClass>("save", async function (next) {
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
	schemaOptions: { collection: "appointment", timestamps: true },
})
export class AppointmentClass {
	@prop({})
	public id!: number;

	@prop({})
	public token!: number;

	@prop({ ref: () => ClinicClass })
	public clinic!: Ref<ClinicClass>;

	@prop({ ref: () => PatientClass })
	public patient!: Ref<PatientClass>;

	@prop({ ref: () => DoctorClass })
	public doctor!: Ref<DoctorClass>;

	@prop({ ref: () => DoctorTimeSlotClass })
	public time_slot!: Ref<DoctorTimeSlotClass>;

	@prop({})
	public date!: Date;

	@prop({})
	public follow_up_date!: Date;

	@prop({})
	public type!: number;

	@prop({})
	public source!: number;

	@prop({})
	public status!: number;

	@prop({})
	public complaint!: string;

	@prop({ default: false })
	public deleted!: boolean;
}

export default getModelForClass(AppointmentClass);
