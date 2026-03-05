import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import Role, { RoleClass } from "./Role";
import { AdminClass } from "./drapp/Admin";
import { GameClass } from "./Game";
import moment from "moment";
import { SattaEntryClass } from "./SattaEntry";
import { GameTimeClass } from "./GameTime";
import { NumberEntryTransectionClass } from "./NumberEntryTransection";

@modelOptions({
	schemaOptions: { collection: "spinner_market", timestamps: true },
})
export class SpinnerMarketClass {
	@prop({})
	public client_name!: string;

	@prop({
		ref: () => NumberEntryTransectionClass,
		type: () => mongoose.Schema.Types.ObjectId,
	})
	public transection!: Ref<NumberEntryTransectionClass>;

	@prop({ ref: () => AdminClass })
	public admin!: Ref<AdminClass>;

	@prop({ ref: () => GameTimeClass })
	public game_time!: Ref<GameTimeClass>;

	@prop({ default: moment().startOf("day") })
	public date!: Date;

	@prop({})
	public token!: string;

	@prop({ default: false })
	public payment_completed!: boolean;

	@prop({ default: false })
	public deleted!: boolean;
}

export default getModelForClass(SpinnerMarketClass);
