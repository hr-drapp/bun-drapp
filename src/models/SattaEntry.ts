import * as mongoose from "mongoose";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { AdminClass } from "./drapp/Admin";
import moment from "moment";
import { GameClass } from "./Game";

@modelOptions({
	schemaOptions: { collection: "satta_entry", timestamps: true },
})
export class SattaEntryClass {
	@prop({})
	public text!: string;

	@prop({})
	public amount!: number;

	@prop({})
	public total_amount!: number;

	@prop({ default: [] })
	public numbers!: Array<number>;

	@prop({ default: {} })
	public numbers_map!: Record<any, any>;

	@prop({ ref: () => AdminClass })
	public admin!: Ref<AdminClass>;

	@prop({ ref: () => GameClass })
	public game!: Ref<GameClass>;

	@prop({})
	public category!: number;

	@prop({})
	public type!: string;

	@prop({ default: "default" })
	public source!: string;

	@prop({ default: false })
	public market!: boolean;

	@prop({ default: moment().startOf("day") })
	public date!: Date;

	@prop({})
	public messageId!: string;

	// new field: TODO: make this update from dashboard.
	@prop({ default: 0 })
	public result_pana!: number;

	@prop({ default: 0 })
	public result_ank!: number;
}

export default getModelForClass(SattaEntryClass);
