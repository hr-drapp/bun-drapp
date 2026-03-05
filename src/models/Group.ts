import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import { GameClass } from "./Game";
import type { Ref } from "@typegoose/typegoose";
import Admin, { AdminClass } from "./drapp/Admin";
import { GameTimeClass } from "./GameTime";

export enum GroupTypeEnum {
	JODI_MIX = 1,
	MIX = 2,
	SPINNER = 3,
}
export enum GroupBeatTypeEnum {
	MULTIPLYER = 1,
	DIVIDED = 2,
}
@modelOptions({ schemaOptions: { collection: "group", timestamps: true } })
export class groupClass {
	@prop()
	public name!: string;

	@prop({ default: 0 })
	public game_time_count!: number;

	@prop({ default: 0 })
	public admin_count!: number;

	@prop({ enum: GroupTypeEnum })
	public type!: number;

	@prop()
	public messageId!: string;

	@prop()
	public groupId!: string;

	@prop({ ref: () => AdminClass })
	public admin?: Ref<AdminClass>;

	@prop({ enum: GroupBeatTypeEnum })
	public beat_type?: number;
}

export default getModelForClass(groupClass);
