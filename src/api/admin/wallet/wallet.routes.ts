import { createElysia } from "src/utils/createElysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import schema from "./wallet.schema";
import { R } from "src/utils/response-helpers";
import { customError } from "src/utils/AppErr";
import Admin from "src/models/drapp/Admin";
import { RoleLevel } from "src/models/Role";
import mongoose from "mongoose";
import Wallet from "src/models/Wallet";
import WalletTransaction from "src/models/WalletTransaction";
import {
	allocateWallet,
	adjustWalletLimit,
	ensureWallet,
	getAvailableAmount,
} from "src/utils/wallet";
import { ModuleId, Summary } from "src/config/modules";
import redis from "src/db/redis";

export default createElysia({ prefix: "/wallets" }).guard(
	{
		detail: { tags: ["Wallets"], summary: Summary([ModuleId.WALLET]) },
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.get(
				"/",
				async ({ query, user }) => {
					const adminId = query.adminId;
					const wallet = await Wallet.findOne({ admin: adminId })
						.populate([{ path: "admin" }])
						.lean();
					if (!wallet) return R("wallet", null, true);

					const available = getAvailableAmount(wallet as any);

					return R("wallet", {
						...wallet,
						available,
					});
				},
				schema.get,
			)
			.post(
				"/allocate",
				async ({ body, user }) => {
					const child = await Admin.findById(body.childAdminId).populate(
						"role",
					);
					if (!child) return customError("Child admin not found");

					const actorRoleLevel = (user.role as any)?.level;
					const childRoleLevel = (child.role as any)?.level;

					if (![RoleLevel.L1, RoleLevel.L2].includes(actorRoleLevel)) {
						return customError("Only L1/L2 can allocate wallets");
					}

					const expectedChildLevel =
						actorRoleLevel === RoleLevel.L1 ? RoleLevel.L2 : RoleLevel.L3;
					if (childRoleLevel !== expectedChildLevel) {
						return customError("Invalid child role for allocation");
					}

					if (
						!user.super_admin &&
						child.parent?.toString() !== user._id.toString()
					) {
						return customError("Child admin does not belong to you");
					}

					const session = await mongoose.startSession();
					session.startTransaction();
					try {
						const result = await allocateWallet({
							parentAdminId: user._id.toString(),
							childAdminId: body.childAdminId,
							amount: body.amount,
							createdBy: user._id.toString(),
							session,
						});

						await session.commitTransaction();
						return R("allocation success", result);
					} catch (err) {
						await session.abortTransaction();
						throw err;
					} finally {
						session.endSession();
					}
				},
				schema.allocate,
			)
			.post(
				"/adjust",
				async ({ body, user }) => {
					if (!user?.super_admin) {
						return customError("Only super admin can adjust wallet limits");
					}

					const session = await mongoose.startSession();
					session.startTransaction();
					try {
						const wallet = await adjustWalletLimit({
							adminId: body.adminId,
							amount: body.amount,
							createdBy: user._id.toString(),
							session,
						});

						await session.commitTransaction();
						return R("wallet adjusted", wallet);
					} catch (err) {
						await session.abortTransaction();
						throw err;
					} finally {
						session.endSession();
					}
				},
				schema.adjust,
			)
			.post(
				"/unlimited",
				async ({ body, user }) => {
					const updated = await Wallet.findOneAndUpdate(
						{ _id: body.wallet },
						{ $set: { unlimited: body.unlimited } },
						{ new: true },
					);

					if (!updated) return customError("Wallet not found");

					await redis.del(`wallet:${updated.admin}`);

					return R("wallet unlimited updated", updated);
				},
				schema.setUnlimited,
			),
);
