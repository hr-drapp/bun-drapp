import { t } from "elysia";
import { BankStatus } from "src/models/Bank";

const name = "Verification";

export const BankSchema = t.Object({
	_id: t.String(),
	name: t.String(),
	user: t.String(),
	account_holder: t.String(),
	account_number: t.String(),
	ifsc: t.String(),
	status: t.String(),
	description: t.String(),
});

export const KycSchema = t.Object({
	_id: t.String(),
	dob: t.String(),
	user: t.String(),
	address: t.String(),
	id_number: t.String(),
	document: t.String(),
	status: t.String(),
	description: t.String(),
});

const MetaPaginationSchema = t.Object({
	pages: t.Number(),
	total: t.Number(),
	page: t.Number(),
	size: t.Number(),
});

export default {
	bank_detail: {
		query: t.Object({
			id: t.String(),
		}),
		response: {

			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: BankSchema,
				},
				{
					description: `${name} bank response`,
				},
			),
		},
		detail: {
			operationId: "astroBankDetail",
		},
	},
	bank_update: {
		query: t.Object({
			id: t.String(),
		}),
		body: t.Object({
			status: t.String(),
			description: t.String()
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: BankSchema,
				},
				{
					description: `${name} bank update response`,
				},
			),
		},
		detail: {
			operationId: "astroBankUpdate",
		},
	},

	kyc_detail: {
		query: t.Object({
			id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: KycSchema,
				},
				{
					description: `${name} kyc response`,
				},
			),
		},
		detail: {
			operationId: "astroKycDetail",
		},
	},
	kyc_update: {
		query: t.Object({
			id: t.String(),
		}),
		body: t.Object({
			status: t.String(),
			description: t.String()
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: KycSchema,
				},
				{
					description: `${name} kyc update response`,
				},
			),
		},
		detail: {
			operationId: "astroKycUpdate",
			// description: "upload",
		},
		// type: "multipart/form-data",
	},

};
