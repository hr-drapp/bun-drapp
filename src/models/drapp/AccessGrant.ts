import {
	getModelForClass,
	index,
	modelOptions,
	prop,
} from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import mongoose, { Types } from "mongoose";
import { ModuleId } from "src/config/modules";
import { AdminClass } from "./Admin";
import { TenantClass } from "../Tenant";

export type AccessGrantResource = ModuleId | string;

export interface AccessGrantFilter {
	field: string;
	value:
		| string
		| number
		| boolean
		| Types.ObjectId
		| Array<string | number | boolean | Types.ObjectId>;
	op?: "$in" | "$eq";
}

@index({ grantee: 1, resource: 1 })
@index({ granted_by: 1, resource: 1 })
@index({ expires_at: 1 })
@modelOptions({
	schemaOptions: {
		collection: "accessgrants",
		timestamps: true,
	},
})
export class AccessGrantClass {
	@prop({ ref: () => AdminClass, required: true })
	public grantee!: Ref<AdminClass>;

	@prop({ ref: () => AdminClass, required: true })
	public granted_by!: Ref<AdminClass>;

	@prop({ required: true })
	public resource!: AccessGrantResource;

	@prop({ type: () => [mongoose.Schema.Types.ObjectId], default: [] })
	public resource_ids!: Types.ObjectId[];

	@prop({ type: () => [Object], default: [] })
	public filters!: AccessGrantFilter[];

	@prop({ ref: () => TenantClass })
	public tenant!: Ref<TenantClass>;

	@prop()
	public expires_at?: Date;
}

export default getModelForClass(AccessGrantClass);
