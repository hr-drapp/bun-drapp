import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { Schema } from "mongoose";
import { UserClass } from "./User";
@modelOptions({ schemaOptions: { collection: "setting" } })
export class SettingClass {

	@prop({})
	public name!: string

	@prop({})
	public key!: string;

	@prop({ type: Schema.Types.Mixed, })
	public value?: any;
}

export default getModelForClass(SettingClass);
