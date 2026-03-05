import { prop, getModelForClass, modelOptions, post } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import env from "src/config/env";
import type { Ref } from "@typegoose/typegoose";
import { ProductCategoryClass } from "./ProductCategory";


@post<ProductClass>('find', (model: any) => {

	for (let item of model) {

		item.images = item.images!.map((i: any) => {
			i = env.appPublicUrl + "/images/" + i;
			return i;
		})

	}
	console.log("🚀 ~ model:", model)

})
@post<ProductClass>('findOne', (model: any) => {


	model.images = model.images?.map((i: any) => {
		i = env.appPublicUrl + "/images/" + i;
		return i;
	})

	console.log("🚀 ~ model:", model)

})
@modelOptions({ schemaOptions: { collection: "products" } })
export class ProductClass {

	@prop({})
	public name!: string;

	@prop({})
	public description!: string;

	@prop({})
	public price!: number;

	@prop({ min: 0, max: 100 })
	public discount!: number;

	@prop({ default: [] })
	public images!: Array<string>;

	@prop({ ref: () => ProductCategoryClass })
	public category!: Ref<ProductCategoryClass>;
}


export default getModelForClass(ProductClass);
