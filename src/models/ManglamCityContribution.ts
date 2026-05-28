import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";

@modelOptions({
	schemaOptions: { collection: "manglam_city_contribution", timestamps: true },
})
export class ManglamCityContributionClass {
	@prop({})
	public name!: string;

	@prop({})
	public phone!: string;

	@prop({})
	public amount!: number;

	@prop({})
	public area!: string;

	@prop({})
	public ip!: string;
}

export default getModelForClass(ManglamCityContributionClass);
