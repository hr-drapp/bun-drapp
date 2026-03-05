import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import { UserClass } from "./User";

export enum BankStatus {
	PENDING="PENDING",REJECTED="REJECTED",APPROVED="APPROVED"
}

@modelOptions({ schemaOptions: { collection: "banks" } })
class BankClass {

	@prop({ ref: () => UserClass })
	public user!: Ref<UserClass>;

	@prop({ })
	public account_holder?: string;

	@prop({ })
	public name?: string;

	@prop({ unique:true })
	public account_number?: string;

	@prop({ })
	public ifsc?: string;
	
	@prop({enum: Object.values(BankStatus),default:BankStatus.PENDING  })
	public status?: string;

	@prop({ default:"your bank details are pending for approval." })
	public description?: string;

}

export default getModelForClass(BankClass);
