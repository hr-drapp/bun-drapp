import {
	prop,
	getModelForClass,
	modelOptions,
	index,
} from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import { GameClass } from "./Game";
import moment from "moment";

export enum GameTimeStatus {
	RESULT_PENDING = 0,
	RESULT_IN_PROGRESS = 1,
}

@modelOptions({
	schemaOptions: { collection: "games_time", timestamps: true },
})
@index({ start: 1, end: 1 })
@index({ game: 1 })
@index({ game: 1, start: 1, end: 1 })
export class GameTimeClass {
	@prop({ ref: () => GameClass, required: true })
	public game!: Ref<GameClass>;

	@prop({})
	public start!: number; // in minutes. Ex: 00:00 => 0, 01:00 => 60

	@prop({})
	public end!: number; // in minutes. Ex: 00:00 => 0, 01:00 => 60

	@prop({ default: 0 })
	public entry_margin!: number; // in minutes. Ex: 00:00 => 0, 01:00 => 60

	@prop({ default: 0 })
	public result_margin!: number; // in minutes. Ex: 00:00 => 0, 01:00 => 60

	@prop({})
	public auto_result!: boolean;

	@prop({ default: 0 })
	public win_margin?: number; // %

	@prop({})
	public result_updated_at?: Date;

	@prop({ default: GameTimeStatus.RESULT_PENDING })
	public status!: number;

	@prop({})
	public result_status?: boolean;

	@prop({})
	public result_processing?: boolean;

	@prop({ default: false })
	public deleted?: boolean;

	//TODO:Last_result updated date type usko result anouved ho tab update cron me chek karna hai aaj ke date se pehle se result
}

export default getModelForClass(GameTimeClass);
