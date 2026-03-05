import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import { UserClass } from "./User";

export enum KycStatus {
	PENDING="PENDING",REJECTED="REJECTED",APPROVED="APPROVED"
}


@modelOptions({ schemaOptions: { collection: "kycs" } })
class KycClass {

	@prop({ ref: () => UserClass })
	public user!: Ref<UserClass>;

	@prop({ })
	public dob?: Date;

	@prop({ })
	public address?: string;

	@prop({ unique:true })
	public id_number?: string;

	@prop({ })
	public document?: string;
	
	@prop({enum: Object.values(KycStatus), default: KycStatus.PENDING  })
	public status?: string;

	@prop({  default:"your kyc details are pending for approval."})
	public description?: string;
}

export default getModelForClass(KycClass);
