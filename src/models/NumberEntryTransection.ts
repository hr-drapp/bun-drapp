import { getModelForClass, prop, modelOptions } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { AdminClass } from "./drapp/Admin";
import { NumbersClass } from "./Numbers";
import moment from "moment";
import { GameClass } from "./Game";
import { GameTimeClass } from "./GameTime";
import { Mixed } from "mongoose";

@modelOptions({
	schemaOptions: { collection: "number_entry_transection", timestamps: true },
})
export class NumberEntryTransectionClass {
	@prop({})
	public amount!: number;

	@prop({ ref: () => NumbersClass })
	public numbers!: Ref<NumbersClass>[];

	@prop({ default: {} })
	public numbers_map!: any;

	@prop({ ref: () => AdminClass })
	public admin!: Ref<AdminClass>;

	@prop({ ref: () => GameClass })
	public game!: Ref<GameClass>;

	@prop({ ref: () => GameTimeClass })
	public game_time!: Ref<GameTimeClass>;

	@prop({ default: "default" })
	public source!: string;

	@prop({ default: moment().startOf("day") })
	public date!: Date;

	@prop({ default: false })
	public market!: boolean;

	@prop({})
	public total_amount!: number;

	@prop({})
	public messageId!: string;

	// New field
	@prop({ default: false })
	public deleted!: boolean;

	@prop({})
	public text?: string;
}

export default getModelForClass(NumberEntryTransectionClass);
