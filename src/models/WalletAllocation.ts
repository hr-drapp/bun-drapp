import {
	prop,
	getModelForClass,
	modelOptions,
	index,
} from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { WalletClass } from "./Wallet";

export enum WalletAllocationStatus {
	ACTIVE = "active",
	REVOKED = "revoked",
}

@index({ parentWallet: 1, childWallet: 1 }, { unique: true })
@modelOptions({
	schemaOptions: { collection: "wallet_allocations", timestamps: true },
})
export class WalletAllocationClass {
	@prop({ ref: () => WalletClass })
	public parentWallet!: Ref<WalletClass>;

	@prop({ ref: () => WalletClass })
	public childWallet!: Ref<WalletClass>;

	@prop({ default: 0 })
	public amount!: number;

	@prop({
		default: WalletAllocationStatus.ACTIVE,
	})
	public status!: string;
}

export default getModelForClass(WalletAllocationClass);
