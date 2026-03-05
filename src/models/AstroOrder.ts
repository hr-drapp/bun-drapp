import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import type { Ref } from "@typegoose/typegoose";
import Role, { RoleClass } from "./Role";
import { AstrologerClass } from "./Astrologer";
import { UserClass } from "./User";
import moment from "moment";

export enum AstroOrderType {
    VIDEO_CALL = "VIDEO_CALL",
    AUDIO_CALL = "AUDIO_CALL",
    CHAT = "CHAT"
}

export enum AstroOrderStatus {
    pending = "pending",
    confirmed = "confirmed",
    completed = "completed",
    canceled = "canceled",
}

@modelOptions({ schemaOptions: { collection: "astro_orders", timestamps: true } })
export class AstroOrder {
    @prop({ ref: () => AstrologerClass })
    public astrologer!: Ref<AstrologerClass>;

    @prop({ ref: () => UserClass })
    public user!: Ref<UserClass>;

    @prop({ enum: { values: Object.values(AstroOrderType) } })
    public type!: string

    @prop({ enum: { values: Object.values(AstroOrderStatus) } })
    public status!: string

    @prop({ default: moment().format() })
    public scheduled_at!: Date;

    @prop({})
    public total_duration!: number

    @prop({})
    public actual_duration!: number
}

export default getModelForClass(AstroOrder);
