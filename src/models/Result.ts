import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { GameTimeClass } from "./GameTime";
import { GameClass } from "./Game";
import moment from "moment";
import { GameNumberClass } from "./GameNumber";
import { NumbersClass } from "./Numbers";

@modelOptions({ schemaOptions: { collection: "result", timestamps: true } })
export class ResultClass {
	@prop({ ref: () => GameTimeClass })
	public game_time!: Ref<GameTimeClass>;

	@prop({ default: () => moment().startOf("day").toDate() })
	public date!: Date;

	@prop({ ref: () => NumbersClass })
	public number!: Ref<NumbersClass>;

	@prop({})
	public end!: number; // in minutes. Ex: 00:00 => 0, 01:00 => 60
}

export default getModelForClass(ResultClass);
