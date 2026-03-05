import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CountryClass } from "./Country";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import { CategoryClass } from "./Category";
import { AstrologerInsightsClass } from "./AstrologerInsights";

export enum Gender {
	M = "M",
	F = "F",
}

export enum Lang {
	HINDI = "HINDI",
	ENGLISH = "ENGLISH",
}

@modelOptions({ schemaOptions: { collection: "astrologers" } })
export class AstrologerClass {
	@prop({})
	public fname!: string;

	@prop({})
	public lname!: string;

	@prop({})
	public email!: string;

	@prop({})
	public phone!: string;

	@prop({})
	public password!: string;

	@prop({ default: 0 })
	public profile_level!: number;

	@prop({ enum: Gender })
	public gender!: string;

	@prop({})
	public dob!: Date;

	@prop({})
	public pob!: string;

	@prop({})
	public address!: string;

	@prop({})
	public photo!: string;

	@prop({ ref: () => CountryClass })
	public country!: Ref<CountryClass>;

	@prop({})
	public state!: string;

	@prop({})
	public distric!: string;

	@prop({})
	public city!: string;

	@prop({})
	public pin_code!: string;

	@prop({})
	public company_name!: string;

	@prop({ ref: () => CategoryClass })
	public category!: Ref<CategoryClass>;

	@prop({ ref: () => CategoryClass })
	public sub_category!: Ref<CategoryClass>;

	@prop({})
	public experience!: number;

	@prop({})
	public languages!: string;

	@prop({})
	public degree!: string;

	@prop({})
	public introduction!: string;

	// hourly
	@prop({})
	public service_charge!: number;

	@prop({ default: true })
	public online!: boolean;

	@prop({ default: true })
	public verified!: boolean

	// Not workng: ReferenceError: Cannot access uninitialized variable.
	// @prop({ ref: () => AstrologerInsightsClass })
	// public astrologer_insights!: Ref<AstrologerInsightsClass>

	// ** Alternate solution
	@prop({})
	public astrologer_insights!: string | AstrologerClass

}

export default getModelForClass(AstrologerClass);
