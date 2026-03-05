import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "categories" } })
export class CategoryClass {
	@prop({ unique: true })
	public name?: string;

	@prop({})
	public photo?: string;

	@prop({ ref: () => CategoryClass })
	public parent!: Ref<CategoryClass>;
}

export default getModelForClass(CategoryClass);
