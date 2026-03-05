import { getModelForClass, prop, modelOptions } from "@typegoose/typegoose";
import { groupClass } from "./Group";
import type { Ref } from "@typegoose/typegoose";
import Admin, { AdminClass } from "./drapp/Admin";

export enum MessageQueueStatus {
	PENDING = "PENDING",
	RESERVED = "RESERVED",
	COMPLETED = "COMPLETED",
}
@modelOptions({
	schemaOptions: { collection: "message_queue", timestamps: true },
})
export class MessageQueueClass {
	@prop({})
	public text?: string;

	@prop({})
	public messageId?: string;

	@prop({})
	public reaction?: string;

	@prop({})
	public group?: string;

	@prop({})
	public quotedId?: string;

	@prop({
		default: MessageQueueStatus.PENDING,
	})
	public status?: string;
}

export default getModelForClass(MessageQueueClass);
