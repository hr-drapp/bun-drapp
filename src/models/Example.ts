import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
@modelOptions({ schemaOptions: { collection: "examples" } })
class NoExample {
	@prop({ unique: true })
	public name?: string;
}

export default getModelForClass(NoExample);
