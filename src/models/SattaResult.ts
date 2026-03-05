import * as mongoose from "mongoose";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { AdminClass } from "./drapp/Admin";
import moment from "moment";
import { GameClass } from "./Game";

@modelOptions({
	schemaOptions: { collection: "satta_result", timestamps: true },
})
export class SattaResult {
	@prop({ ref: () => GameClass })
	public game!: Ref<GameClass>;

	@prop({ default: () => moment().startOf("day").toDate() })
	public date!: Date;

	// new field: TODO: make this update from dashboard.
	@prop({})
	public result_pana?: string;

	@prop({})
	public result_ank!: string;
}

export default getModelForClass(SattaResult);
