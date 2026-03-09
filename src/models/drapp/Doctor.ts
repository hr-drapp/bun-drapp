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
import { TenantClass } from "./Tenant";

@pre<DoctorClass>("save", async function (next) {
	if (!this.id) {
		this.id = await GetAutoIncrId(AutoIncIdModel.DOCTOR);
	}

	if (!this.clinic) {
		const clinic = await getDefaultClinic();
		if (clinic) {
			this.clinic = clinic._id;
		}
	}
	next();
})
@modelOptions({ schemaOptions: { collection: "doctor", timestamps: true } })
export class DoctorClass {
	@prop({})
	public id!: number;

	@prop({ ref: () => ClinicClass })
	public clinic!: Ref<ClinicClass>;

	@prop({ ref: () => TenantClass })
	public tenant!: Ref<TenantClass>;

	@prop({})
	public name!: string;

	@prop({})
	public profile_pic!: string;

	@prop({ default: [] })
	public pictures!: string[];
}

export default getModelForClass(DoctorClass);
