import { t } from "elysia";

const name = "vobiz";

/** Vobiz sends form fields (names vary per event); accept anything and log it. */
const params = t.Optional(t.Record(t.String(), t.Any()));
const query = t.Object({ token: t.Optional(t.String()) }, { additionalProperties: true });

const webhook = (operationId: string) => ({
	body: params,
	query,
	detail: { operationId },
});

export default {
	meta: { name },
	// Answer URL of the Vobiz application: register caller, ring next doctor (XML)
	answer: webhook("vobizAnswer"),
	// <Dial callbackUrl>: answer / connected / hangup of the doctor leg
	dialEvent: webhook("vobizDialEvent"),
	// <Dial action>: final dial result (XML)
	dialResult: webhook("vobizDialResult"),
	// Hangup URL of the Vobiz application: caller leg ended
	hangup: webhook("vobizHangup"),
	// <Record callbackUrl>: recording ready
	recording: webhook("vobizRecording"),
	// answer_url of a click-to-call: doctor picked up, now dial the patient (XML)
	clickAnswer: {
		body: params,
		query: t.Object(
			{ token: t.Optional(t.String()), to: t.Optional(t.String()), sig: t.Optional(t.String()) },
			{ additionalProperties: true },
		),
		detail: { operationId: "vobizClickAnswer" },
	},
	// Recorded IVR messages Vobiz <Play>s
	audioFile: {
		params: t.Object({ file: t.String() }),
		detail: { operationId: "vobizAudioFile" },
	},
	// Signed recording proxy the dashboard's <audio> plays
	recordingFile: {
		params: t.Object({ id: t.String() }),
		query: t.Object({ sig: t.Optional(t.String()) }),
		detail: { operationId: "vobizRecordingFile" },
	},
};
