import { prop, getModelForClass } from "@typegoose/typegoose";
import * as mongoose from "mongoose";

export enum Gender {
	M = "M",
	F = "F",
}

export class UserClass {
	@prop({})
	public fname!: string;

	@prop({})
	public lname!: string;

	@prop({})
	public email!: string;

	@prop({})
	public phone!: string;

	@prop({})
	public password!: string;

	@prop({ enum: Gender })
	public gender!: string;

	@prop({})
	public dob!: Date;

	@prop({})
	public pob!: string;

	@prop({})
	public address!: string;

	@prop({})
	public photo!: string;

	@prop({ default: 0 })
	public deposit_wallet!: number;
}

export default getModelForClass(UserClass);
