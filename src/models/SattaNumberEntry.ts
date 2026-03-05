import * as mongoose from "mongoose";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { AdminClass } from "./drapp/Admin";
import moment from "moment";
import { SattaEntryClass } from "./SattaEntry";
import { GameClass } from "./Game";

@modelOptions({
	schemaOptions: { collection: "satta_number_entry", timestamps: true },
})
export class SattaNumberEntryClass {
	@prop({})
	public amount!: number;

	@prop({ default: 0 })
	public number!: number;

	@prop({ ref: () => AdminClass })
	public admin!: Ref<AdminClass>;

	@prop({ ref: () => SattaEntryClass })
	public satta_entry!: Ref<SattaEntryClass>;

	@prop({ ref: () => GameClass })
	public game!: Ref<GameClass>;

	@prop({})
	public category!: number;

	@prop({ default: "default" })
	public source!: string;

	@prop({ default: false })
	public market!: boolean;

	@prop({ default: moment().startOf("day") })
	public date!: Date;
}

export default getModelForClass(SattaNumberEntryClass);
