import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";

export enum AdminRequestStatus {
	PENDING = "PENDING",
	APPROVED = "APPROVED",
	REJECTED = "REJECTED",
}

@modelOptions({ schemaOptions: { collection: "admin_requests", timestamps: true } })
export class AdminRequestClass {
	@prop({})
	public name!: string;

	@prop({ unique: true })
	public phone!: string;

	@prop({ unique: true })
	public email!: string;

	@prop({})
	public status!: string;

}

export default getModelForClass(AdminRequestClass);
