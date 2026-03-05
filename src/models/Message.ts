import { getModelForClass, prop, modelOptions } from "@typegoose/typegoose";
import { groupClass } from "./Group";
import type { Ref } from "@typegoose/typegoose";
import Admin, { AdminClass } from "./drapp/Admin";

export enum messageStatus {
	Pending = "pending",
	Success = "success",
}
@modelOptions({ schemaOptions: { collection: "message", timestamps: true } })
export class MessageClass {
	@prop({})
	public text?: string;

	@prop({})
	public messageId?: string;

	@prop({ ref: () => groupClass })
	public group?: Ref<groupClass>;

	@prop({})
	public quotedId?: string;

	@prop({
		type: String,
		enum: {
			values: Object.values(messageStatus),
			default: messageStatus.Pending,
		},
	})
	public status?: messageStatus;

	@prop({ ref: () => AdminClass })
	public user?: Ref<AdminClass>;
}

export default getModelForClass(MessageClass);
