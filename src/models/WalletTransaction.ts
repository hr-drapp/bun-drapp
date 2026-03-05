import {
	prop,
	getModelForClass,
	modelOptions,
	index,
} from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { WalletClass } from "./Wallet";
import { AdminClass } from "./drapp/Admin";

export enum WalletTransactionType {
	CREDIT = "CREDIT",
	DEBIT = "DEBIT",
	ALLOCATE = "ALLOCATE",
	DEALLOCATE = "DEALLOCATE",
	REVERSAL = "REVERSAL",
	ADJUSTMENT = "ADJUSTMENT",
}

@index({ wallet: 1, createdAt: -1 })
@modelOptions({
	schemaOptions: { collection: "wallet_transactions", timestamps: true },
})
export class WalletTransactionClass {
	@prop({ ref: () => WalletClass })
	public wallet!: Ref<WalletClass>;

	@prop({ ref: () => AdminClass })
	public admin!: Ref<AdminClass>;

	@prop({})
	public type!: string;

	@prop({ default: 0 })
	public amount!: number;

	@prop({})
	public refType!: string;

	@prop({})
	public refId!: any;

	@prop({ default: {} })
	public meta!: Record<string, any>;

	@prop({ ref: () => AdminClass })
	public createdBy!: Ref<AdminClass>;
}

export default getModelForClass(WalletTransactionClass);
