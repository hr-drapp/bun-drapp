import { prop, getModelForClass, modelOptions, } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import { UserClass } from "./User";

export enum PaymentType {
	ORDER = "ORDER",
	DEPOSIT = "DEPOSIT"
}

export enum PaymentStatus {
	PENDING = "PENDING",
	FAILED = "FAILED",
	SUCCESS = "SUCCESS",
	REFUNDED = "REFUNDED",
}



@modelOptions({ schemaOptions: { collection: "payments", timestamps: true } })
export class PaymentClass {

	@prop({ ref: () => UserClass })
	public user!: Ref<UserClass>

	@prop({})
	public reference_id!: string;

	@prop({})
	public amount!: number

	@prop({
		enum: {
			values: Object.values(PaymentType)
		}
	})
	public type!: string

	@prop({
		enum: {
			values: Object.values(PaymentStatus)
		}
	})
	status!: string
}

export default getModelForClass(PaymentClass);
