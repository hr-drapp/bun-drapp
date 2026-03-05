import { getModelForClass, prop, modelOptions } from "@typegoose/typegoose";
import { groupClass } from "./Group";
import type { Ref } from "@typegoose/typegoose";
import Admin, { AdminClass } from "./drapp/Admin";

export enum MessageReactQueueStatus {
	PENDING = "PENDING",
	RESERVED = "RESERVED",
	REACTED = "REACTED",
	COMPLETED = "COMPLETED",
}
@modelOptions({
	schemaOptions: { collection: "message_react_queue", timestamps: true },
})
export class MessageReactQueueClass {
	@prop({})
	public reaction?: string;

	@prop({})
	public message_id?: string;

	@prop({
		type: String,
		enum: {
			values: Object.values(MessageReactQueueStatus),
			default: MessageReactQueueStatus.PENDING,
		},
	})
	public status?: MessageReactQueueStatus;
}

export default getModelForClass(MessageReactQueueClass);
