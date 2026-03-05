import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { GameClass } from "./Game";
import { GameTimeClass } from "./GameTime";

@modelOptions({ schemaOptions: { collection: "notices", timestamps: true } })
export class Notice {
  @prop({})
  text!: string;

  @prop({ ref: () => GameTimeClass })
  game_time!: Ref<GameTimeClass>;

  @prop({ default: Date.now })
  public date!: Date;
}

export default getModelForClass(Notice);
