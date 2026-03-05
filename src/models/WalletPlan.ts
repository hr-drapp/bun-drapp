import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
@modelOptions({ schemaOptions: { collection: "wallet_plans" } })
export class WalletPlanClass {

	@prop({})
	public name!: string;

	@prop({})
	public amount!: number;

	@prop({ default: 0, min: 0, max: 100 })
	public discount!: number
}

export default getModelForClass(WalletPlanClass);
