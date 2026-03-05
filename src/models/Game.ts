import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import { GameCategoryClass } from "./GameCategory";

@modelOptions({ schemaOptions: { collection: "games", timestamps: true } })
export class GameClass {
	@prop({})
	public name!: string;

	@prop({ ref: () => GameCategoryClass, required: true })
	public game_category!: Ref<GameCategoryClass>;

	@prop({ default: false })
	public deleted?: boolean;
}

export default getModelForClass(GameClass);
