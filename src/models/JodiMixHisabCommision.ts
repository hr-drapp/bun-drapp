import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { AdminClass } from "./drapp/Admin";
import type { Ref } from "@typegoose/typegoose";

@modelOptions({
	schemaOptions: { collection: "Jodicomission", timestamps: true },
})
export class JodiHisabComissonClass {
	@prop({ ref: () => AdminClass })
	admin!: Ref<AdminClass>;

	@prop({ default: 1 })
	commision!: number;

	@prop({ default: 1 })
	andar!: number;

	@prop({ default: 1 })
	bahar!: number;

	@prop({ default: 1 })
	total!: number;

	@prop({ default: 1 })
	jodi?: number;
}

export default getModelForClass(JodiHisabComissonClass);
