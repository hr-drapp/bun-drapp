import { timingSafeEqual } from "crypto";
import Clinic from "src/models/clicknic/Clinic";
import Patient from "src/models/clicknic/Patient";
import { WebhookTrace } from "src/utils/webhook-trace";
import {
	IVR_UNKNOWN_PATIENT_NAME,
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
 */
export const lookupCaller = async (callerNumber: string, trace: WebhookTrace) => {
	const phone = normalizePhone(callerNumber);
	trace.set({ contact_number: phone.display });

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
	const patient = await Patient.findOne({
		...scope,
		phone: { $in: phone.variants },
		deleted: false,
	})
		.sort({ createdAt: 1 })
		.lean();

	if (patient) {
		trace.set({ patient: patient._id });
		trace.step(`Registered patient found: "${patient.name}" (#${patient.id}, ${patient._id})`);
		return true;
	}

	const created = await Patient.create({
		...scope,
		name: IVR_UNKNOWN_PATIENT_NAME,
		phone: phone.local,
		age: 0,
		gender: 3,
		profile_pic: "",
	});
	trace.set({ patient: created._id });
	trace.step(`No patient with ${phone.local} in clinic "${clinic.name}", registered new patient #${created.id} (${created._id})`);
	return false;
};
