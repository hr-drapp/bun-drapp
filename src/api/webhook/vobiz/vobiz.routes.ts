import schema from "./vobiz.schema";
import { createElysia } from "src/utils/createElysia";
import { WebhookTrace } from "src/utils/webhook-trace";
import { WebhookLogStatus } from "src/models/clicknic/WebhookLog";
import {
	IVR_AUDIO,
	VOBIZ_PROVIDER,
	cleanEnv,
	dialXml,
	fetchRecording,
	hangupXml,
	isValidWebhookToken,
	ivrAudioFile,
	type IvrAudio,
	verifySignature,
	webhookUrl,
} from "src/utils/Vobiz";
import {
	applyDialEvent,
	applyDialResult,
	applyHangup,
	applyRecording,
	handleIncomingCall,
	type VobizParams,
} from "./vobiz.service";

type Ctx = {
	body: unknown;
	query: Record<string, string | undefined>;
	headers: Record<string, string | undefined>;
	request: Request;
	set: { status?: number | string; headers: Record<string, any> };
	path: string;
};

/** Vobiz may send params in the body (form) or query string; merge, minus our token. */
const readParams = ({ body, query }: Ctx): VobizParams => {
	const out: VobizParams = {};
	for (const [k, v] of Object.entries(query ?? {})) if (k !== "token" && k !== "sig") out[k] = v;
	if (body && typeof body === "object") {
		for (const [k, v] of Object.entries(body as Record<string, unknown>)) out[k] = v == null ? undefined : String(v);
	}
	return out;
};

/**
 * Logs one Vobiz request to webhook_log (provider "vobiz"), checks the token,
 * and answers with XML. Errors fall back to `fallbackXml` so a caller is never
 * left in silence.
 */
const traced = async (
	event: string,
	ctx: Ctx,
	handler: (params: VobizParams, trace: WebhookTrace) => Promise<{ xml: string; ignored?: boolean }>,
	fallbackXml = hangupXml(),
) => {
	const params = readParams(ctx);
	ctx.set.headers["content-type"] = "application/xml";
	const trace = await WebhookTrace.start({
		provider: VOBIZ_PROVIDER,
		event,
		method: ctx.request.method,
		path: ctx.path,
		ip: ctx.headers["x-forwarded-for"] || ctx.headers["x-real-ip"],
		body: params,
	});

	if (!isValidWebhookToken(ctx.query?.token)) {
		trace.step(ctx.query?.token ? "token mismatch, rejected with 401" : "No token sent, rejected with 401");
		trace.set({ http_status: 401 });
		ctx.set.status = 401;
		void trace.finish(WebhookLogStatus.UNAUTHORIZED, {});
		return hangupXml();
	}
	trace.step("Webhook token verified");

	try {
		const { xml, ignored } = await handler(params, trace);
		trace.set({ http_status: 200 });
		void trace.finish(ignored ? WebhookLogStatus.IGNORED : WebhookLogStatus.SUCCESS, { response: xml });
		return xml;
	} catch (error: any) {
		trace.step(`Error: ${error?.message}`);
		trace.set({ http_status: 200 });
		void trace.finish(WebhookLogStatus.FAILED, { error: error?.stack || error?.message, response: fallbackXml });
		return fallbackXml;
	}
};

const EMPTY = `<?xml version="1.0" encoding="UTF-8"?>\n<Response></Response>`;

/**
 * Vobiz provider, same job as Knowlarity: inbound IVR routing to the clinic's
 * doctors (round robin), live call status into ivr_call_request, recordings,
 * and click-to-call bridging. Configure in the Vobiz console:
 *   Answer URL : {VOBIZ_PUBLIC_URL}/webhook/vobiz/answer[?token=…]  (POST)
 *   Hangup URL : {VOBIZ_PUBLIC_URL}/webhook/vobiz/hangup[?token=…]  (POST)
 * Every request is logged to webhook_log.
 */
export default createElysia({ prefix: schema.meta.name }).guard(
	{
		detail: { tags: ["webhook"] },
	},
	(app) =>
		app
			.post(
				"/answer",
				(ctx) =>
					traced("answer", ctx as unknown as Ctx, async (params, trace) => ({
						xml: await handleIncomingCall(params, trace),
					})),
				schema.answer,
			)
			.post(
				"/dial-event",
				(ctx) =>
					traced(
						"dial-event",
						ctx as unknown as Ctx,
						async (params, trace) => ({ xml: EMPTY, ignored: !(await applyDialEvent(params, trace)) }),
						EMPTY,
					),
				schema.dialEvent,
			)
			.post(
				"/dial-result",
				(ctx) =>
					traced("dial-result", ctx as unknown as Ctx, async (params, trace) => {
						const { call, xml } = await applyDialResult(params, trace);
						return { xml, ignored: !call };
					}),
				schema.dialResult,
			)
			.post(
				"/hangup",
				(ctx) =>
					traced(
						"hangup",
						ctx as unknown as Ctx,
						async (params, trace) => ({ xml: EMPTY, ignored: !(await applyHangup(params, trace)) }),
						EMPTY,
					),
				schema.hangup,
			)
			.post(
				"/recording",
				(ctx) =>
					traced(
						"recording",
						ctx as unknown as Ctx,
						async (params, trace) => ({ xml: EMPTY, ignored: !(await applyRecording(params, trace)) }),
						EMPTY,
					),
				schema.recording,
			)
			.post(
				"/click-answer",
				(ctx) =>
					traced("click-answer", ctx as unknown as Ctx, async (params, trace) => {
						const to = ctx.query?.to ?? "";
						if (!verifySignature(to, ctx.query?.sig)) {
							trace.step("Click-to-call target signature invalid, hanging up");
							return { xml: hangupXml(), ignored: true };
						}
						trace.step(`Doctor ${params.To ?? "-"} picked up, dialling patient ${to}`);
						trace.set({ contact_number: to, execution_id: params.CallUUID });
						return {
							xml: dialXml({
								number: to,
								callerId: cleanEnv("VOBIZ_NUMBER") || params.From || "",
								actionUrl: webhookUrl("/click-result"),
								callbackUrl: webhookUrl("/click-event"),
							}),
						};
					}),
				schema.clickAnswer,
			)
			// Click-to-call legs aren't IVR calls; accept their callbacks so Vobiz doesn't retry.
			.post("/click-event", () => EMPTY, schema.dialEvent)
			.post("/click-result", ({ set }) => {
				set.headers["content-type"] = "application/xml";
				return hangupXml();
			}, schema.dialResult)
			// Recorded IVR messages Vobiz <Play>s (no token: Vobiz fetches them like any media URL).
			.get(
				"/audio/:file",
				async ({ params, set }) => {
					const name = params.file.replace(/\.mp3$/, "");
					const file = name in IVR_AUDIO ? await ivrAudioFile(name as IvrAudio) : null;
					if (!file) {
						set.status = 404;
						return "audio not available";
					}
					return new Response(file, {
						headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=86400" },
					});
				},
				schema.audioFile,
			)
			.get(
				"/recording/:id",
				async ({ params, query, set }) => {
					if (!verifySignature(params.id, query.sig)) {
						set.status = 403;
						return "forbidden";
					}
					const media = await fetchRecording(params.id).catch(() => null);
					if (!media?.body) {
						set.status = 404;
						return "recording not available";
					}
					return new Response(media.body, {
						headers: {
							"content-type": media.headers.get("content-type") || "audio/mpeg",
							"cache-control": "private, max-age=3600",
						},
					});
				},
				schema.recordingFile,
			),
);
