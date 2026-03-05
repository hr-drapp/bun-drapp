import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CountryClass } from "./Country";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import { CategoryClass } from "./Category";
import { AstrologerClass } from "./Astrologer";


@modelOptions({ schemaOptions: { collection: "astrologer_insights", timestamps: true } })
export class AstrologerInsightsClass {

	@prop({ ref: () => AstrologerClass })
	public astrologer!: Ref<AstrologerClass>;

	@prop({ default: 0 })
	public total_time!: number;

	@prop({ default: 0 })
	public total_count!: number;

	@prop({ default: 0 })
	public vc_time!: number;

	@prop({ default: 0 })
	public vc_count!: number;

	@prop({ default: 0 })
	public ac_time!: number;

	@prop({ default: 0 })
	public ac_count!: number;

	@prop({ default: 0 })
	public chat_count!: number;

	@prop({ default: [0, 0, 0, 0, 0] })
	public rating_overview!: Array<number>


}

export default getModelForClass(AstrologerInsightsClass);
