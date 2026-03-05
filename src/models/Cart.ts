import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import { UserClass } from "./User";
import type { Ref } from "@typegoose/typegoose";
import { ProductClass } from "./Product";

@modelOptions({ schemaOptions: { collection: "cart", timestamps: true } })
export class CartClass {

	@prop({ ref: () => UserClass })
	public user!: Ref<UserClass>;

	@prop({ default: [] })
	public items!: Array<CartItem>

}

export interface CartItem {
	product_id: string;
	product?: ProductClass;
	quantity: number
	amount?: number
}

export default getModelForClass(CartClass);
