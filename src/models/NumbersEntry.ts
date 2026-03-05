import { getModelForClass, prop, modelOptions } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { AdminClass } from "./drapp/Admin";
import { NumbersClass } from "./Numbers";
import moment from "moment";
import { GameClass } from "./Game";
import { GameTimeClass } from "./GameTime";

@modelOptions({
	schemaOptions: { collection: "numbers_entry", timestamps: true },
})
export class NumberEntryClass {
	@prop({})
	public amount!: number;

	@prop({ ref: () => NumbersClass })
	public number!: Ref<NumbersClass>;

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
}

export default getModelForClass(NumberEntryClass);

// trancation model bana or isme messaeId save karni hai as satta number entry ke jese

// TODO:new cron jo har minut chalegi while loop or iske andar 1 min sleep or uske baad render hoga or game end check karega or chek karega or result nhi dala to result dalega
