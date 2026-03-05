import {
	prop,
	getModelForClass,
	modelOptions,
	index,
} from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import { GameCategoryClass } from "./GameCategory";
import { GameClass } from "./Game";
import { NumbersClass } from "./Numbers";

@modelOptions({
	schemaOptions: { collection: "game_number", timestamps: true },
})
@index({ game: 1, number: 1 }, { unique: true })
export class GameNumberClass {
	@prop({ ref: () => GameClass, required: true })
	public game!: Ref<GameClass>;

	@prop({ ref: () => NumbersClass, required: true })
	public number!: Ref<NumbersClass>;
}

export default getModelForClass(GameNumberClass);
