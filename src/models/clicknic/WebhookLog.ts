import {
	prop,
	getModelForClass,
	modelOptions,
	index,
	Severity,
} from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { ClinicClass } from "./Clinic";
import { TenantClass } from "./Tenant";
import { PatientClass } from "./Patient";
import { IvrCallRequestClass } from "./IvrCallRequest";

export enum WebhookLogStatus {
	RECEIVED = "received",
	SUCCESS = "success",
	FAILED = "failed",
	UNAUTHORIZED = "unauthorized",
	IGNORED = "ignored",
}

/** Logs are kept for 30 days, then MongoDB removes them automatically. */
export const WEBHOOK_LOG_TTL_SECONDS = 60 * 60 * 24 * 30;

@index({ createdAt: 1 }, { expireAfterSeconds: WEBHOOK_LOG_TTL_SECONDS })
@index({ execution_id: 1 })
@index({ clinic: 1, createdAt: -1 })
@modelOptions({
	schemaOptions: { collection: "webhook_log", timestamps: true },
	options: { allowMixed: Severity.ALLOW },
})
export class WebhookLogClass {
	/** Clinic is only known once the webhook resolves it; null until then. */
	@prop({ ref: () => ClinicClass })
	public clinic?: Ref<ClinicClass>;

	@prop({ ref: () => TenantClass })
	public tenant?: Ref<TenantClass>;

	@prop({ ref: () => PatientClass })
	public patient?: Ref<PatientClass>;

	@prop({ ref: () => IvrCallRequestClass })
	public ivr_call_request?: Ref<IvrCallRequestClass>;

	/** e.g. "bolna" */
	@prop({ required: true })
	public provider!: string;

	/** e.g. "caller-lookup", "execution-status" */
	@prop({ required: true })
	public event!: string;

	@prop({})
	public method!: string;

	@prop({})
	public path!: string;

	@prop({ default: WebhookLogStatus.RECEIVED })
	public status!: string;

	@prop({})
	public http_status?: number;

	@prop({})
	public execution_id?: string;

	@prop({})
	public contact_number?: string;

	/** Step-by-step text summary of what happened, one timestamped line per step. */
	@prop({ default: "" })
	public logs!: string;

	@prop({})
	public error?: string;

	@prop({})
	public duration_ms?: number;

	@prop({})
	public ip?: string;

	@prop({})
	public query?: any;

	@prop({})
	public body?: any;

	@prop({})
	public response?: any;
}

export default getModelForClass(WebhookLogClass);
