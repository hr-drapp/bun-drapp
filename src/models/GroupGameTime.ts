import {
	prop,
	getModelForClass,
	modelOptions,
	index,
} from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import { GameClass } from "./Game";
import type { Ref } from "@typegoose/typegoose";
import Admin, { AdminClass } from "./drapp/Admin";
import { GameTimeClass } from "./GameTime";
import { groupClass } from "./Group";

@modelOptions({
	schemaOptions: { collection: "group_game_time", timestamps: true },
})
@index({ group: 1, game_time: 1 }, { unique: true })
export class GroupGameTimeClass {
	@prop({ ref: () => groupClass })
	public group?: Ref<groupClass>;

	@prop({ ref: () => GameTimeClass })
	public game_time?: Ref<GameTimeClass>;
}

export default getModelForClass(GroupGameTimeClass);
