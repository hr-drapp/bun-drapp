import Elysia, { t } from "elysia";
import {
	isAdminAuthenticated,
	isUserAuthenticated,
} from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import verificationSchema from "./verification.schema";
import Admin from "src/models/drapp/Admin";
import CountryClass from "src/models/Country";
import { createElysia } from "src/utils/createElysia";
import Bank, { BankStatus } from "src/models/Bank";
import Kyc, { KycStatus } from "src/models/Kyc";
import AstrologerClass from "src/models/Astrologer";

export default createElysia({ prefix: "/verification" }).guard(
	{
		beforeHandle: isUserAuthenticated,
		detail: {
			tags: ["Verification"],
		},
	},
	(app) =>
		app
			.get(
				"/bank",
				async ({ query }) => {
					const { id } = query;
					const entry = await Bank.findOne({ user: id });

					if (!entry) {
						customError("no bank found.");
					}

					return R("bank data", entry);
				},
				verificationSchema.bank_detail,
			)
			.post(
				"/bank",
				async ({ query, body }) => {
					const { id } = query;

					let entry = await Bank.findById(id);

					if (!entry) {
						return customError("Not found");
					}

					const astro = await AstrologerClass.findById(entry.user);

					if (!astro) {
						return customError("user not found");
					}

					if (astro.profile_level < 2) {
						return customError("can't approve as bank is not approved");
					}

					if (body.status == KycStatus.APPROVED) {
						if (entry.status == KycStatus.APPROVED) {
							return customError("Already approved");
						}

						if (astro.profile_level < 3) {
							astro.profile_level = 3;
							await astro.save();
						}
					} else if (body.status == KycStatus.REJECTED) {
						if (astro.profile_level == 3) {
							astro.profile_level = 2;
							await astro.save();
						}
					}

					Object.assign(entry, { ...body });

					await entry.save();

					return R("bank data updated", entry);
				},
				verificationSchema.bank_update,
			)
			.get(
				"/kyc",
				async ({ query }) => {
					const { id } = query;
					const entry = await Kyc.findOne({ user: id });

					if (!entry) {
						customError("no Kyc found.");
					}

					return R("Kyc data", entry);
				},
				verificationSchema.kyc_detail,
			)
			.post(
				"/kyc",
				async ({ query, body }) => {
					const { id } = query;

					let entry = await Kyc.findById(id);

					if (!entry) {
						return customError("Not found");
					}

					const astro = await AstrologerClass.findById(entry.user);

					if (!astro) {
						return customError("user not found");
					}

					if (astro.profile_level < 3) {
						return customError("can't approve as bank is not approved");
					}

					if (body.status == KycStatus.APPROVED) {
						if (entry.status == KycStatus.APPROVED) {
							return customError("Already approved");
						}

						if (astro.profile_level < 4) {
							astro.profile_level = 4;
							await astro.save();
						}
					} else if (body.status == KycStatus.REJECTED) {
						if (astro.profile_level == 4) {
							astro.profile_level = 3;
							await astro.save();
						}
					}

					Object.assign(entry, { ...body });

					await entry.save();

					return R("Kyc data updated", entry);
				},
				verificationSchema.kyc_update,
			),
);
