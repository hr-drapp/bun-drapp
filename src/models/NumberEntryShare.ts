import * as mongoose from "mongoose";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { AdminClass } from "./drapp/Admin";
import moment from "moment";
import { GameClass } from "./Game";
import { GameTimeClass } from "./GameTime";

@modelOptions({
	schemaOptions: { collection: "number_entry_share", timestamps: true },
})
export class NumberEntryShareClass {
	@prop({ ref: () => AdminClass })
	public admin!: Ref<AdminClass>;

	@prop({ ref: () => GameClass })
	public game!: Ref<GameClass>;

	@prop({ ref: () => GameTimeClass })
	public game_time!: Ref<GameTimeClass>;

	@prop({})
	public category!: number;

	@prop({ default: moment().startOf("day") })
	public date!: Date;

	@prop({})
	public team_member!: string;

	@prop({ default: 0 })
	public team_member_share!: number;

	@prop({})
	public team_member_share_type!: "percentage" | "cutting";

	@prop({})
	public master!: string;

	@prop({ default: 0 })
	public master_share!: number;

	@prop({})
	public master_share_type!: "percentage" | "cutting";

	@prop({})
	public super_admin!: string;

	@prop({ default: 0 })
	public super_admin_share!: number;

	@prop({})
	public super_admin_share_type!: "percentage" | "cutting";
}

export default getModelForClass(NumberEntryShareClass);
