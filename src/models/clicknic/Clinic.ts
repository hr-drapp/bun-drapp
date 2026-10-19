import {
	prop,
	getModelForClass,
	modelOptions,
	pre,
} from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import { GetAutoIncrId } from "src/utils/common";
import { AutoIncIdModel } from "./AutoIncementalId";
import { TenantClass } from "./Tenant";

@pre<ClinicClass>("save", async function (next) {
	if (!this.id) {
		this.id = await GetAutoIncrId(AutoIncIdModel.CLINIC);
	}

	next();
})
@modelOptions({ schemaOptions: { collection: "clinic", timestamps: true } })
export class ClinicClass {
	@prop({})
	public id!: number;

	@prop({})
	public name!: string;

	@prop({})
	public domain!: string;

	@prop({})
	public logo!: string;

	@prop({ ref: () => TenantClass })
	public tenant!: Ref<TenantClass>;

	@prop({ default: false })
	public default!: boolean;

	/** Bolna agent ids whose incoming calls belong to this clinic. */
	@prop({ type: () => [String], default: [] })
	public ivr_agent_ids?: string[];
}

export default getModelForClass(ClinicClass);
