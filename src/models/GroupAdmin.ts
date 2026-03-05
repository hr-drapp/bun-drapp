import {
	prop,
	getModelForClass,
	modelOptions,
	index,
} from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { AdminClass } from "./drapp/Admin";
import { groupClass } from "./Group";

@modelOptions({
	schemaOptions: { collection: "group_admin", timestamps: true },
})
@index({ group: 1, admin: 1 }, { unique: true })
export class GroupAdminClass {
	@prop({ ref: () => groupClass })
	public group?: Ref<groupClass>;

	@prop({ ref: () => AdminClass })
	public admin?: Ref<AdminClass>;
}

export default getModelForClass(GroupAdminClass);
