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
import { AdminClass } from "./Admin";
import { TenantClass } from "./Tenant";

@pre<PatientClass>("save", async function (next) {
	if (!this.id) {
		this.id = await GetAutoIncrId(AutoIncIdModel.CLINIC);
	}

	next();
})
@modelOptions({ schemaOptions: { collection: "patient", timestamps: true } })
export class PatientClass {
	@prop({})
	public id!: number;

	@prop({ ref: () => ClinicClass })
	public clinic!: Ref<ClinicClass>;

	@prop({ ref: () => TenantClass })
	public tenant!: Ref<TenantClass>;

	@prop({})
	public name!: string;

	@prop({})
	public phone!: string;

	@prop({})
	public age!: number;

	@prop({}) // 0 female, 1 male
	public gender!: number;

	@prop({})
	public profile_pic!: string;

	@prop({ default: false })
	public deleted!: boolean;
}

export default getModelForClass(PatientClass);
