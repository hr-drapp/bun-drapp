import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import Role, { RoleClass } from "./Role";

@modelOptions({ schemaOptions: { collection: "clients", timestamps: true } })
export class ClientClass {
	@prop({ unique: true })
	public name!: string;
}

export default getModelForClass(ClientClass);
