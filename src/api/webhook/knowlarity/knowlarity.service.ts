import { timingSafeEqual } from "crypto";
import Clinic from "src/models/clicknic/Clinic";
import Patient from "src/models/clicknic/Patient";
import { WebhookTrace } from "src/utils/webhook-trace";
import {
	IVR_UNKNOWN_PATIENT_NAME,
	normalizePhone,
} from "../bolna/bolna.service";

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
 * Registered = a real patient with this number exists in the default clinic.
 * Callers auto-created by the Bolna flow ("Unknown Caller") are not real
 * registrations, so they still count as new patients.
 */
export const lookupCaller = async (callerNumber: string, trace: WebhookTrace) => {
	const phone = normalizePhone(callerNumber);
	trace.set({ contact_number: phone.display });

	if (phone.local.length < 10) {
		trace.step(`Invalid caller number "${callerNumber}" (fewer than 10 digits), treating as new patient`);
		return false;
	}
	trace.step(`Caller number "${callerNumber}" normalized to ${phone.local}`);

	const clinic = await Clinic.findOne({ default: true }).lean();
	if (!clinic) {
		trace.step("No default clinic configured, treating as new patient");
		return false;
	}
	trace.set({ clinic: clinic._id, tenant: clinic.tenant });

	const patient = await Patient.findOne({
		clinic: clinic._id,
		tenant: clinic.tenant,
		phone: { $in: phone.variants },
		name: { $ne: IVR_UNKNOWN_PATIENT_NAME },
		deleted: false,
	})
		.sort({ createdAt: 1 })
		.lean();

	if (patient) {
		trace.set({ patient: patient._id });
		trace.step(`Registered patient found: "${patient.name}" (#${patient.id}, ${patient._id})`);
	} else {
		trace.step(`No registered patient with ${phone.local} in clinic "${clinic.name}"`);
	}
	return !!patient;
};
