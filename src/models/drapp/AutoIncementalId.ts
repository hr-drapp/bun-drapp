import {
	prop,
	getModelForClass,
	modelOptions,
	index,
} from "@typegoose/typegoose";
import { Mixed } from "mongoose";

export enum AutoIncIdModel {
	CLINIC = 0,
	DOCTOR = 1,
	PATIENT = 2,
}

@index({ seq: 1 })
@modelOptions({
	schemaOptions: { collection: "autoincrementalid", timestamps: true },
})
export class AutoIncementalIdClass {
	@prop({ required: true, unique: true })
	public id!: Mixed;

	@prop({ default: 0 })
	public seq!: number;
}

export default getModelForClass(AutoIncementalIdClass);
