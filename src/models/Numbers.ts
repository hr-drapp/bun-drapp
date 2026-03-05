import { getModelForClass, prop, modelOptions } from "@typegoose/typegoose";

export enum Status {
	INACTIVE = 0,
	ACTIVE = 1,
}

export enum NumberTypeEnum {
	ANK = 1,
	JODI = 2,
	ANDAR = 2.1,
	BAHAR = 2.2,
	TOTAL = 2.3,
	PANA = 3,
	SPINNER = 4,
}

@modelOptions({
	schemaOptions: { collection: "numberEntries", timestamps: true },
})
export class NumbersClass {
	@prop({})
	public text!: string; // emoji

	@prop({ enum: Status, default: Status.ACTIVE })
	public status!: number;

	@prop({ enum: NumberTypeEnum })
	public type!: number;

	@prop({})
	public texts!: string; // supportive texts example - "lion,sher"
}

export default getModelForClass(NumbersClass);
