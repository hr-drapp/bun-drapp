import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";
import { UserClass } from "./User";
import { AstrologerClass } from "./Astrologer";
import type { Ref } from "@typegoose/typegoose";


@modelOptions({ schemaOptions: { collection: "chat_rooms" } })
export class ChatRoom {

	@prop({})
	public name!: string

	@prop({ ref: () => AstrologerClass })
	public astrologer!: Ref<AstrologerClass>;

	@prop({ ref: () => UserClass })
	public user!: Ref<UserClass>;
}

export default getModelForClass(ChatRoom);
