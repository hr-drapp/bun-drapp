import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import { UserClass } from "./User";
@modelOptions({ schemaOptions: { collection: "address" } })
export class AddressClass {

	@prop({})
	public name!: string

	@prop({})
	public address?: string;

	@prop({})
	public city?: string;

	@prop({})
	public state?: string;

	@prop({})
	public pin?: string;

	@prop({ ref: () => UserClass })
	public user!: UserClass
}

export default getModelForClass(AddressClass);
