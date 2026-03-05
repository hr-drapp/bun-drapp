import {
	prop,
	getModelForClass,
	modelOptions,
	index,
} from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { AdminClass } from "./drapp/Admin";

export enum WalletStatus {
	ACTIVE = "active",
	SUSPENDED = "suspended",
}

@index({ admin: 1 }, { unique: true })
@modelOptions({
	schemaOptions: { collection: "wallets", timestamps: true },
})
export class WalletClass {
	@prop({ ref: () => AdminClass })
	public admin!: Ref<AdminClass>;

	@prop({ default: 0 })
	public limit!: number;

	@prop({ default: 0 })
	public used!: number;

	@prop({ default: 0 })
	public allocated!: number;

	@prop({ default: WalletStatus.ACTIVE })
	public status!: string;

	@prop({ default: true })
	public unlimited!: boolean;

	@prop({ default: 0 })
	public version!: number;
}

export default getModelForClass(WalletClass);
