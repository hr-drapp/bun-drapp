import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import { UserClass } from "./User";
import type { Ref } from "@typegoose/typegoose";
import { CartItem } from "./Cart";
import { PaymentClass } from "./Payment";
import { AddressClass } from "./Address";


export enum OrderStatus {
	PaymentPending = "Payment Pending",
	PaymentProcessed = "Payment Processed",
	Processing = "Processing",
	Shipped = "Shipped",
	OutForDelivery = "Out for Delivery",
	Delivered = "Delivered",
	Canceled = "Canceled",
	OnHold = "On Hold",
	Refunded = "Refunded",
	Returned = "Returned",
	PartiallyShipped = "Partially Shipped",
	AwaitingFulfillment = "Awaiting Fulfillment",
	AwaitingPayment = "Awaiting Payment",
}


@modelOptions({ schemaOptions: { collection: "cart", timestamps: true } })
export class OrderClass {

	@prop({ ref: () => UserClass })
	public user!: Ref<UserClass>;

	@prop({ default: [] })
	public items!: Array<CartItem>

	@prop({})
	public total_order_amount!: number

	@prop({})
	public delivery_charge!: number

	@prop({})
	public tax!: number

	@prop({})
	public total_amount!: number

	@prop({ enum: { values: Object.values(OrderStatus) } })
	public status!: string

	@prop({ ref: () => PaymentClass })
	public payment!: Ref<PaymentClass>

	@prop({ ref: () => AddressClass })
	public address!: Ref<AddressClass>

}



export default getModelForClass(OrderClass);
