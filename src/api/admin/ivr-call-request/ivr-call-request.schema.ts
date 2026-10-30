import { t } from "elysia";
import { ModuleId } from "src/config/modules";
import { MetaPaginationSchema } from "src/utils/common";

const name = "ivr-call-request";

const detailSchema = t.Object({
	_id: t.String(),
	patient: t.Object({
		_id: t.String(),
		id: t.Optional(t.Number()),
		name: t.String(),
		phone: t.String(),
		age: t.Optional(t.Number()),
		gender: t.Optional(t.Number()),
		village: t.Optional(
			t.Union([
				t.String(),
				t.Object({
					_id: t.String(),
					id: t.Optional(t.Number()),
					name: t.String(),
				}),
				t.Null(),
			]),
		),
		profile_pic: t.Optional(t.String()),
	}),
	contact_number: t.String(),
	agent_id: t.Optional(t.String()),
	agent_number: t.Optional(t.String()),
	execution_id: t.String(),
	status: t.String(),
	is_active: t.Boolean(),
	is_new_patient: t.Boolean(),
	note: t.String(),
	duration: t.Optional(t.Number()),
	recording_url: t.Optional(t.String()),
	summary: t.Optional(t.String()),
	transcript: t.Optional(t.String()),
	ended_at: t.Optional(t.String()),
	deleted: t.Boolean(),
	createdAt: t.String(),
	updatedAt: t.String(),
});

const insightSchema = t.Object({
	active: t.Number(),
	today: t.Number(),
	today_new_patients: t.Number(),
});

export default {
	meta: {
		name: name,
		detail: detailSchema,
		module: ModuleId.IVR_CALL_REQUESTS,
	},
	// ── list (paginated) ──────────────────────────────────────────────
	list: {
		query: t.Object({
			page: t.String(),
			size: t.String(),
			search: t.Optional(t.String()),
			deleted: t.Optional(t.String()),
			active: t.Optional(t.String()),
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
	// ── update (note) ─────────────────────────────────────────────────
	update: {
		body: t.Object({
			note: t.Optional(t.String()),
		}),
		query: t.Object({ id: t.String() }),
		response: {
			200: t.Object(
				{ status: t.Boolean(), message: t.String(), data: detailSchema },
				{ description: `${name} update response` },
			),
		},
		detail: { operationId: "update" },
	},
	// ── end (manual hang-up when the provider's status webhook never came) ──
	end: {
		query: t.Object({ id: t.String() }),
		response: {
			200: t.Object(
				{ status: t.Boolean(), message: t.String(), data: detailSchema },
				{ description: `${name} end response` },
			),
		},
		detail: { operationId: "end" },
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
	// ── delete (soft toggle) ──────────────────────────────────────────
	delete: {
		query: t.Object({ id: t.String() }),
		response: {
			200: t.Object(
				{ status: t.Boolean(), message: t.String(), data: detailSchema },
				{ description: `${name} delete response` },
			),
		},
		detail: { operationId: "delete" },
	},
	// ── insight ───────────────────────────────────────────────────────
	insight: {
		response: {
			200: t.Object(
				{ status: t.Boolean(), message: t.String(), data: insightSchema },
				{ description: `${name} insight response` },
			),
		},
		detail: { operationId: "insight" },
	},
};
