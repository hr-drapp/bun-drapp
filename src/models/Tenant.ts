import {
	getModelForClass,
	prop,
	pre,
	modelOptions,
} from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "tenant", timestamps: true } })
export class TenantClass {
	@prop({ required: true })
	public name!: string;

	@prop({ default: false })
	public default?: boolean;

	@prop({ default: false })
	public deleted?: boolean;
}

const Tenant = getModelForClass(TenantClass, {
	schemaOptions: {
		timestamps: true,
	},
});

export default Tenant;
