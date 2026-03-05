import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { AdminClass } from "./drapp/Admin";
import type { Ref } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "comission", timestamps: true } })
export class HisabComissonClass {
	@prop({ ref: () => AdminClass })
	public admin!: Ref<AdminClass>;

	@prop({ default: 1 })
	public comission!: number;

	@prop({ default: 1 })
	public multiplyer!: number;
}

export default getModelForClass(HisabComissonClass);
