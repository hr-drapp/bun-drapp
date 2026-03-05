import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import Role, { RoleClass } from "./Role";
import { AdminClass } from "./drapp/Admin";
import { GameClass } from "./Game";
import moment from "moment";
import { SattaEntryClass } from "./SattaEntry";

@modelOptions({ schemaOptions: { collection: "markets", timestamps: true } })
export class MarketClass {
	@prop({ default: 1 })
	public type!: number;

	@prop({})
	public client_name!: string;

	@prop({
		ref: () => SattaEntryClass,
		type: () => [mongoose.Schema.Types.ObjectId],
	})
	public single!: Ref<SattaEntryClass>[];

	@prop({
		ref: () => SattaEntryClass,
		type: () => [mongoose.Schema.Types.ObjectId],
	})
	public jodi!: Ref<SattaEntryClass>[];

	@prop({
		ref: () => SattaEntryClass,
		type: () => [mongoose.Schema.Types.ObjectId],
	})
	public andar!: Ref<SattaEntryClass>[];

	@prop({
		ref: () => SattaEntryClass,
		type: () => [mongoose.Schema.Types.ObjectId],
	})
	public bahar!: Ref<SattaEntryClass>[];

	@prop({
		ref: () => SattaEntryClass,
		type: () => [mongoose.Schema.Types.ObjectId],
	})
	public total!: Ref<SattaEntryClass>[];

	@prop({
		ref: () => SattaEntryClass,
		type: () => [mongoose.Schema.Types.ObjectId],
	})
	public pana!: Ref<SattaEntryClass>[];

	@prop({ ref: () => AdminClass })
	public admin!: Ref<AdminClass>;

	@prop({ ref: () => GameClass })
	public game!: Ref<GameClass>;

	@prop({ default: moment().startOf("day") })
	public date!: Date;

	@prop({})
	public token!: string;

	@prop({ default: false })
	public payment_completed!: boolean;
}

export default getModelForClass(MarketClass);
