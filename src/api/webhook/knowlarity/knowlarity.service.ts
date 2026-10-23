import { timingSafeEqual } from "crypto";
import Clinic from "src/models/clicknic/Clinic";
import Patient from "src/models/clicknic/Patient";
import IvrCallRequest from "src/models/clicknic/IvrCallRequest";
import { WebhookTrace } from "src/utils/webhook-trace";
import {
	IVR_UNKNOWN_PATIENT_NAME,
	isActiveStatus,
	normalizePhone,
} from "../bolna/bolna.service";

const KNOWLARITY_CLINIC_ID = "69de8c299b532254712e76c0";

/**
 * The API key is optional for now: while KNOWLARITY_API_KEY is unset every
 * request is allowed (testing phase). Set it to start enforcing `x-api-key`.
 */
export const isValidApiKey = (received?: string) => {
	const expected = process.env.KNOWLARITY_API_KEY;
	if (!expected) return true;
	if (!received) return false;
	const a = Buffer.from(received);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Registered = a patient with this number already exists in the clinic.
 * A first-time caller is registered as "Unknown Caller" and answered as new,
 * so the next call from the same number comes back as registered.
 * Like Bolna, the call is recorded in ivr_call_request, idempotent per call_uuid.
 */
export const lookupCaller = async ({
	callerNumber,
	knowlarityNumber,
	callUuid,
	trace,
}: {
	callerNumber: string;
	knowlarityNumber?: string;
	callUuid?: string;
	trace: WebhookTrace;
}) => {
	const phone = normalizePhone(callerNumber);
	trace.set({ contact_number: phone.display, execution_id: callUuid });

	if (phone.local.length < 10) {
		trace.step(`Invalid caller number "${callerNumber}" (fewer than 10 digits), treating as new patient`);
		return false;
	}
	trace.step(`Caller number "${callerNumber}" normalized to ${phone.local}`);

	// TEMP: pinned to clicknic Clinic until clinic is resolved from knowlarity_number
	const clinic = await Clinic.findById(KNOWLARITY_CLINIC_ID).lean();
	if (!clinic) {
		trace.step(`Clinic ${KNOWLARITY_CLINIC_ID} not found, treating as new patient`);
		return false;
	}
	trace.set({ clinic: clinic._id, tenant: clinic.tenant });

	const scope = { clinic: clinic._id, tenant: clinic.tenant };
	let isNewPatient = false;
	let patient = await Patient.findOne({
		...scope,
		phone: { $in: phone.variants },
		deleted: false,
	})
		.sort({ createdAt: 1 })
		.lean();

	if (patient) {
		trace.step(`Registered patient found: "${patient.name}" (#${patient.id}, ${patient._id})`);
	} else {
		const created = await Patient.create({
			...scope,
			name: IVR_UNKNOWN_PATIENT_NAME,
			phone: phone.local,
			age: 0,
			gender: 3,
			profile_pic: "",
		});
		patient = created.toObject();
		isNewPatient = true;
		trace.step(`No patient with ${phone.local} in clinic "${clinic.name}", registered new patient #${created.id} (${created._id})`);
	}
	trace.set({ patient: patient._id });

	await recordCall({ scope, patientId: patient._id, phone: phone.display, knowlarityNumber, callUuid, isNewPatient, trace });

	return !isNewPatient;
};

/** Adds the call to ivr_call_request; Knowlarity retries with the same call_uuid are no-ops. */
const recordCall = async ({
	scope,
	patientId,
	phone,
	knowlarityNumber,
	callUuid,
	isNewPatient,
	trace,
}: {
	scope: { clinic: any; tenant: any };
	patientId: any;
	phone: string;
	knowlarityNumber?: string;
	callUuid?: string;
	isNewPatient: boolean;
	trace: WebhookTrace;
}) => {
	if (!callUuid) {
		trace.step("No call_uuid sent, IVR call request not recorded");
		return;
	}

	const status = "in-progress";
	// Typings ignore includeResultMetadata on lean(); the shape is { value, lastErrorObject }.
	const result = (await IvrCallRequest.findOneAndUpdate(
		{ execution_id: callUuid },
		{
			$setOnInsert: {
				...scope,
				patient: patientId,
				contact_number: phone,
				agent_id: knowlarityNumber,
				execution_id: callUuid,
				status,
				is_active: isActiveStatus(status),
				is_new_patient: isNewPatient,
			},
		},
		{ upsert: true, new: true, includeResultMetadata: true },
	).lean()) as unknown as {
		value: any;
		lastErrorObject?: { updatedExisting?: boolean };
	};

	const callRequest = result.value;
	trace.set({ ivr_call_request: callRequest?._id });
	trace.step(
		result.lastErrorObject?.updatedExisting
			? `IVR call request already existed for call ${callUuid} (retry), left unchanged`
			: `IVR call request created (${callRequest?._id}) with status "${status}"`,
	);
};
