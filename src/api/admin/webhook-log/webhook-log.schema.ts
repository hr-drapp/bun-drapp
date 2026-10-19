import { t } from "elysia";
import { ModuleId } from "src/config/modules";
import { MetaPaginationSchema } from "src/utils/common";

const name = "webhook-log";

const detailSchema = t.Object({
	_id: t.String(),
	clinic: t.Optional(t.String()),
	tenant: t.Optional(t.String()),
	patient: t.Optional(
		t.Object({
			_id: t.String(),
			name: t.String(),
			phone: t.String(),
		}),
	),
	ivr_call_request: t.Optional(t.String()),
	provider: t.String(),
	event: t.String(),
	method: t.String(),
	path: t.String(),
	status: t.String(),
	http_status: t.Optional(t.Number()),
	execution_id: t.Optional(t.String()),
	contact_number: t.Optional(t.String()),
	logs: t.String(),
	error: t.Optional(t.String()),
	duration_ms: t.Optional(t.Number()),
	ip: t.Optional(t.String()),
	query: t.Optional(t.Any()),
	body: t.Optional(t.Any()),
	response: t.Optional(t.Any()),
	createdAt: t.String(),
	updatedAt: t.String(),
});

export default {
	meta: {
		name: name,
		detail: detailSchema,
		module: ModuleId.WEBHOOK_LOGS,
	},
	// ── list (paginated) ──────────────────────────────────────────────
	list: {
		query: t.Object({
			page: t.String(),
			size: t.String(),
			search: t.Optional(t.String()),
			status: t.Optional(t.String()),
			event: t.Optional(t.String()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(detailSchema),
					meta: MetaPaginationSchema,
				},
				{ description: `${name} list response` },
			),
		},
		detail: { operationId: "list" },
	},
	// ── detail ────────────────────────────────────────────────────────
	detail: {
		query: t.Object({ id: t.String() }),
		response: {
			200: t.Object(
				{ status: t.Boolean(), message: t.String(), data: detailSchema },
				{ description: `${name} detail response` },
			),
		},
		detail: { operationId: "detail" },
	},
};
