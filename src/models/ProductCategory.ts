import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "product_categories" } })
export class ProductCategoryClass {
	@prop({ unique: true })
	public name?: string;

	@prop({})
	public photo?: string;

	@prop({ ref: () => ProductCategoryClass })
	public parent!: Ref<ProductCategoryClass>;
}

export default getModelForClass(ProductCategoryClass);
