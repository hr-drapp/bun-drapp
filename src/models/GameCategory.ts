import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";

@modelOptions({
	schemaOptions: { collection: "game_category", timestamps: true },
})
export class GameCategoryClass {
	@prop({})
	public name!: string;

	@prop({ default: 0 })
	public total_count!: number;
}

export default getModelForClass(GameCategoryClass);
