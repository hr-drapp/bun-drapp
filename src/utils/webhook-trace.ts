import { Types } from "mongoose";
import WebhookLog, { WebhookLogStatus } from "src/models/clicknic/WebhookLog";

type TraceFields = Partial<{
	clinic: any;
	tenant: any;
	patient: any;
	ivr_call_request: any;
	execution_id: string;
	contact_number: string;
	http_status: number;
}>;

/**
 * Records one webhook call in the `webhook_log` collection.
 * The entry is inserted as soon as the request arrives; steps are buffered in
 * memory and written by `finish()`. Logging failures never break the webhook.
 */
export class WebhookTrace {
	readonly id = new Types.ObjectId();
	private readonly startedAt = Date.now();
	private readonly lines: string[] = [];
	private readonly fields: TraceFields = {};

	static async start(entry: {
		provider: string;
		event: string;
		method: string;
		path: string;
		ip?: string;
		query?: any;
		body?: any;
	}) {
		const trace = new WebhookTrace();
		trace.step(`${entry.method} ${entry.path} received`);

		try {
			await WebhookLog.create({
				_id: trace.id,
				...entry,
				status: WebhookLogStatus.RECEIVED,
				logs: trace.text(),
			});
		} catch (error: any) {
			console.error("🚀 ~ WebhookTrace.start ~ error:", error?.message);
		}

		return trace;
	}

	step(message: string) {
		this.lines.push(
			`[${new Date().toISOString()}] (+${Date.now() - this.startedAt}ms) ${message}`,
		);
	}

	set(fields: TraceFields) {
		Object.assign(this.fields, fields);
	}

	text() {
		return this.lines.join("\n");
	}

	async finish(
		status: WebhookLogStatus,
		{ response, error }: { response?: any; error?: string } = {},
	) {
		const duration = Date.now() - this.startedAt;
		this.step(`Finished as "${status}" in ${duration}ms`);

		try {
			await WebhookLog.updateOne(
				{ _id: this.id },
				{
					$set: {
						...this.fields,
						status,
						response,
						error,
						duration_ms: duration,
						logs: this.text(),
					},
				},
			);
		} catch (err: any) {
			console.error("🚀 ~ WebhookTrace.finish ~ error:", err?.message);
		}
	}
}
