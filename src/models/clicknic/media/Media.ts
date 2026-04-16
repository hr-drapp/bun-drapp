import {
	prop,
	getModelForClass,
	modelOptions,
	pre,
} from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import { GetAutoIncrId } from "src/utils/common";
import { TenantClass } from "../Tenant";
import { ClinicClass } from "../Clinic";

@modelOptions({ schemaOptions: { collection: "media", timestamps: true } })
export class MediaClass {
	@prop({})
	public name!: string;

	@prop({})
	public media_type!: string;

	@prop({})
	public resource!: number; // ModuleId

	@prop({})
	public url!: string;

	@prop({})
	public size!: string;

	@prop({ ref: () => TenantClass })
	public tenant!: Ref<TenantClass>;

	@prop({ ref: () => ClinicClass })
	public clinic!: Ref<ClinicClass>;

	@prop({ default: false })
	public deleted!: boolean;
}

export default getModelForClass(MediaClass);
