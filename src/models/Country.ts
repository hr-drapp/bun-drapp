import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";

@modelOptions({ schemaOptions: { collection: "countries" } })
export class CountryClass {
	@prop({ unique: true })
	public name?: string;
}

export default getModelForClass(CountryClass);
