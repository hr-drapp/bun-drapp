import mongoose from "mongoose";
import Wallet, { WalletClass, WalletStatus } from "src/models/Wallet";
import WalletTransaction, {
	WalletTransactionType,
} from "src/models/WalletTransaction";
import WalletAllocation, {
	WalletAllocationStatus,
} from "src/models/WalletAllocation";
import Admin from "src/models/drapp/Admin";
import { customError } from "src/utils/AppErr";
import redis from "src/db/redis";

const WALLET_CACHE_TTL_SECONDS = 30;

const walletCacheKey = (adminId: string) => `wallet:${adminId}`;

const getCachedWallet = async (adminId: string) => {
	try {
		return await redis.getJson(walletCacheKey(adminId));
	} catch {
		return null;
	}
};

const setCachedWallet = async (wallet: WalletClass) => {
	try {
		await redis.set(
			walletCacheKey(wallet.admin.toString()),
			JSON.stringify({
				limit: wallet.limit,
				used: wallet.used,
				allocated: wallet.allocated,
				status: wallet.status,
				unlimited: wallet.unlimited,
			}),
			"EX",
			WALLET_CACHE_TTL_SECONDS,
		);
	} catch {
		// Cache failures should not block core flow.
	}
};

export const ensureWallet = async (
	adminId: string,
	session?: mongoose.ClientSession,
) => {
	let wallet = await Wallet.findOne({ admin: adminId }).session(
		session || null,
	);

	if (!wallet) {
		try {
			const created = await Wallet.create(
				[
					{
						admin: adminId,
						limit: 0,
						used: 0,
						allocated: 0,
						status: WalletStatus.ACTIVE,
					},
				],
				{ session },
			);
			wallet = created[0];
		} catch (err: any) {
			wallet = await Wallet.findOne({ admin: adminId }).session(
				session || null,
			);
		}
	}

	return wallet;
};

export const getAvailableAmount = (wallet: WalletClass) =>
	wallet.limit - wallet.used - wallet.allocated;

export const reserveWalletUsage = async ({
	adminId,
	amount,
	session,
	meta,
}: {
	adminId: string;
	amount: number;
	session: mongoose.ClientSession;
	meta?: Record<string, any>;
}) => {
	if (amount <= 0) return { wallet: null as any };

	const cached = await getCachedWallet(adminId);
	if (cached && cached.status === WalletStatus.ACTIVE) {
		if (cached.unlimited === false) {
			const available = cached.limit - cached.used - cached.allocated;
			if (available < amount) {
				customError("Wallet limit exceeded");
			}
		}
	}

	const wallet = await ensureWallet(adminId, session);
	if (!wallet) customError("Wallet not found");
	if (wallet!.status !== WalletStatus.ACTIVE) customError("Wallet suspended");

	const updated = await Wallet.findOneAndUpdate(
		wallet!.unlimited === false
			? {
					_id: wallet!._id,
					status: WalletStatus.ACTIVE,
					$expr: {
						$gte: [
							{
								$subtract: [
									"$limit",
									{
										$add: ["$used", "$allocated"],
									},
								],
							},
							amount,
						],
					},
			  }
			: {
					_id: wallet!._id,
					status: WalletStatus.ACTIVE,
			  },
		{ $inc: { used: amount } },
		{ new: true, session },
	);

	if (!updated) customError("Wallet limit exceeded");

	await setCachedWallet(updated as any);

	return { wallet: updated, meta };
};

export const logWalletTransaction = async ({
	walletId,
	adminId,
	type,
	amount,
	refType,
	refId,
	meta,
	createdBy,
	session,
}: {
	walletId: string;
	adminId: string;
	type: WalletTransactionType;
	amount: number;
	refType: string;
	refId: any;
	meta?: Record<string, any>;
	createdBy: string;
	session: mongoose.ClientSession;
}) => {
	await WalletTransaction.create(
		[
			{
				wallet: walletId,
				admin: adminId,
				type,
				amount,
				refType,
				refId,
				meta: meta || {},
				createdBy,
			},
		],
		{ session },
	);
};

export const reverseWalletUsage = async ({
	adminId,
	amount,
	refType,
	refId,
	meta,
	createdBy,
	session,
}: {
	adminId: string;
	amount: number;
	refType: string;
	refId: any;
	meta?: Record<string, any>;
	createdBy: string;
	session: mongoose.ClientSession;
}) => {
	if (amount <= 0) return;

	const wallet = await ensureWallet(adminId, session);
	if (!wallet) customError("Wallet not found");

	const updated = await Wallet.findOneAndUpdate(
		{
			_id: wallet!._id,
			$expr: {
				$gte: ["$used", amount],
			},
		},
		{ $inc: { used: -amount } },
		{ new: true, session },
	);

	if (!updated) customError("Wallet reversal failed");

	await setCachedWallet(updated as any);

	await logWalletTransaction({
		walletId: updated!._id.toString(),
		adminId,
		type: WalletTransactionType.REVERSAL,
		amount,
		refType,
		refId,
		meta,
		createdBy,
		session,
	});
};

export const allocateWallet = async ({
	parentAdminId,
	childAdminId,
	amount,
	createdBy,
	session,
}: {
	parentAdminId: string;
	childAdminId: string;
	amount: number;
	createdBy: string;
	session: mongoose.ClientSession;
}) => {
	if (amount === 0) customError("Amount must be non-zero");

	const parentAdmin = await Admin.findById(parentAdminId)
		.select({ super_admin: 1 })
		.session(session || null)
		.lean();
	const parentIsSuperAdmin = !!parentAdmin?.super_admin;

	const parentWallet = await ensureWallet(parentAdminId, session);
	const childWallet = await ensureWallet(childAdminId, session);

	if (parentIsSuperAdmin) {
		const absAmount = Math.abs(amount);
		let updatedChild: any | null = null;

		if (amount < 0) {
			updatedChild = await Wallet.findOneAndUpdate(
				{
					_id: childWallet!._id,
					$expr: {
						$gte: [
							{
								$subtract: [
									"$limit",
									{
										$add: ["$used", "$allocated"],
									},
								],
							},
							absAmount,
						],
					},
				},
				{ $inc: { limit: -absAmount } },
				{ new: true, session },
			);
			if (!updatedChild) customError("Insufficient available limit to reduce");
		} else {
			updatedChild = await Wallet.findOneAndUpdate(
				{ _id: childWallet!._id },
				{ $inc: { limit: absAmount } },
				{ new: true, session },
			);
		}

		await setCachedWallet(updatedChild as any);
		await logWalletTransaction({
			walletId: updatedChild!._id.toString(),
			adminId: childAdminId,
			type: WalletTransactionType.ADJUSTMENT,
			amount,
			refType: "AdminAdjustment",
			refId: updatedChild!._id,
			meta: { parentAdminId },
			createdBy,
			session,
		});

		return { parentWallet, childWallet: updatedChild };
	}

	const absAmount = Math.abs(amount);

	if (amount < 0) {
		const updatedParent = await Wallet.findOneAndUpdate(
			{
				_id: parentWallet!._id,
				status: WalletStatus.ACTIVE,
				$expr: {
					$gte: ["$allocated", absAmount],
				},
			},
			{ $inc: { allocated: -absAmount } },
			{ new: true, session },
		);

		if (!updatedParent) customError("Insufficient wallet for deallocation");

		const updatedChild = await Wallet.findOneAndUpdate(
			{
				_id: childWallet!._id,
				$expr: {
					$gte: [
						{
							$subtract: [
								"$limit",
								{
									$add: ["$used", "$allocated"],
								},
							],
						},
						absAmount,
					],
				},
			},
			{ $inc: { limit: -absAmount } },
			{ new: true, session },
		);

		if (!updatedChild) customError("Insufficient available limit to reduce");

		const updatedAllocation = await WalletAllocation.findOneAndUpdate(
			{
				parentWallet: updatedParent!._id,
				childWallet: updatedChild!._id,
				$expr: { $gte: ["$amount", absAmount] },
			},
			{ $inc: { amount: -absAmount } },
			{ new: true, session },
		);

		if (!updatedAllocation) customError("Insufficient allocation to deduct");

		if (updatedAllocation!.amount <= 0) {
			await WalletAllocation.updateOne(
				{ _id: updatedAllocation!._id },
				{ $set: { status: WalletAllocationStatus.REVOKED } },
				{ session },
			);
		} else if (updatedAllocation!.status !== WalletAllocationStatus.ACTIVE) {
			await WalletAllocation.updateOne(
				{ _id: updatedAllocation!._id },
				{ $set: { status: WalletAllocationStatus.ACTIVE } },
				{ session },
			);
		}

		await logWalletTransaction({
			walletId: updatedParent!._id.toString(),
			adminId: parentAdminId,
			type: WalletTransactionType.DEALLOCATE,
			amount: absAmount,
			refType: "WalletAllocation",
			refId: updatedChild!._id,
			meta: { childAdminId },
			createdBy,
			session,
		});

		await logWalletTransaction({
			walletId: updatedChild!._id.toString(),
			adminId: childAdminId,
			type: WalletTransactionType.DEBIT,
			amount: -absAmount,
			refType: "WalletAllocation",
			refId: updatedParent!._id,
			meta: { parentAdminId },
			createdBy,
			session,
		});

		await setCachedWallet(updatedParent as any);
		await setCachedWallet(updatedChild as any);

		return { parentWallet: updatedParent, childWallet: updatedChild };
	}

	const updatedParent = await Wallet.findOneAndUpdate(
		{
			_id: parentWallet!._id,
			status: WalletStatus.ACTIVE,
			$expr: {
				$gte: [
					{
						$subtract: [
							"$limit",
							{
								$add: ["$used", "$allocated"],
							},
						],
					},
					amount,
				],
			},
		},
		{ $inc: { allocated: amount } },
		{ new: true, session },
	);

	if (!updatedParent) customError("Insufficient wallet for allocation");

	const updatedChild = await Wallet.findOneAndUpdate(
		{ _id: childWallet!._id },
		{ $inc: { limit: amount } },
		{ new: true, session },
	);

	await WalletAllocation.findOneAndUpdate(
		{
			parentWallet: updatedParent!._id,
			childWallet: updatedChild!._id,
		},
		{
			$inc: { amount },
			$set: { status: WalletAllocationStatus.ACTIVE },
		},
		{ upsert: true, new: true, session },
	);

	await logWalletTransaction({
		walletId: updatedParent!._id.toString(),
		adminId: parentAdminId,
		type: WalletTransactionType.ALLOCATE,
		amount: -amount,
		refType: "WalletAllocation",
		refId: updatedChild!._id,
		meta: { childAdminId },
		createdBy,
		session,
	});

	await logWalletTransaction({
		walletId: updatedChild!._id.toString(),
		adminId: childAdminId,
		type: WalletTransactionType.CREDIT,
		amount,
		refType: "WalletAllocation",
		refId: updatedParent!._id,
		meta: { parentAdminId },
		createdBy,
		session,
	});

	await setCachedWallet(updatedParent as any);
	await setCachedWallet(updatedChild as any);

	return { parentWallet: updatedParent, childWallet: updatedChild };
};

export const adjustWalletLimit = async ({
	adminId,
	amount,
	createdBy,
	session,
}: {
	adminId: string;
	amount: number;
	createdBy: string;
	session: mongoose.ClientSession;
}) => {
	if (amount === 0) customError("Amount must be non-zero");

	const wallet = await ensureWallet(adminId, session);

	if (amount < 0) {
		const updated = await Wallet.findOneAndUpdate(
			{
				_id: wallet!._id,
				$expr: {
					$gte: [
						{
							$subtract: [
								"$limit",
								{
									$add: ["$used", "$allocated"],
								},
							],
						},
						Math.abs(amount),
					],
				},
			},
			{ $inc: { limit: amount } },
			{ new: true, session },
		);
		if (!updated) customError("Insufficient available limit to reduce");
		await setCachedWallet(updated as any);
		await logWalletTransaction({
			walletId: updated!._id.toString(),
			adminId,
			type: WalletTransactionType.ADJUSTMENT,
			amount,
			refType: "AdminAdjustment",
			refId: updated!._id,
			meta: { amount },
			createdBy,
			session,
		});
		return updated;
	}

	const updated = await Wallet.findOneAndUpdate(
		{ _id: wallet!._id },
		{ $inc: { limit: amount } },
		{ new: true, session },
	);
	await setCachedWallet(updated as any);
	await logWalletTransaction({
		walletId: updated!._id.toString(),
		adminId,
		type: WalletTransactionType.ADJUSTMENT,
		amount,
		refType: "AdminAdjustment",
		refId: updated!._id,
		meta: { amount },
		createdBy,
		session,
	});
	return updated;
};
