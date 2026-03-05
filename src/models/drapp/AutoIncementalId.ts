import {
	prop,
	getModelForClass,
	modelOptions,
	index,
} from "@typegoose/typegoose";

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
	@prop({ enum: AutoIncIdModel, required: true, unique: true })
	public id!: number;

	@prop({ default: 0 })
	public seq!: number;
}

export default getModelForClass(AutoIncementalIdClass);
