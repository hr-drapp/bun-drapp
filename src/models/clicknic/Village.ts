import {
	prop,
	getModelForClass,
	modelOptions,
	pre,
} from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { GetAutoIncrId } from "src/utils/common";
import { AutoIncIdModel } from "./AutoIncementalId";
import { ClinicClass } from "./Clinic";
import { TenantClass } from "./Tenant";

@pre<VillageClass>("save", async function (next) {
	if (!this.id) {
		this.id = await GetAutoIncrId(AutoIncIdModel.VILLAGE);
	}

	next();
})
@modelOptions({ schemaOptions: { collection: "village", timestamps: true } })
export class VillageClass {
	@prop({})
	public id!: number;

	@prop({ ref: () => ClinicClass })
	public clinic!: Ref<ClinicClass>;

	@prop({ ref: () => TenantClass })
	public tenant!: Ref<TenantClass>;

	@prop({ required: true, trim: true })
	public name!: string;

	@prop({ default: false })
	public deleted!: boolean;
}

export default getModelForClass(VillageClass);
