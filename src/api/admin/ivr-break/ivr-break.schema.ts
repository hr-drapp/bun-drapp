import { t } from "elysia";
import { ModuleId } from "src/config/modules";
import { MetaPaginationSchema } from "src/utils/common";

const name = "ivr-break";

/** The logged-in doctor's own IVR availability. */
const statusSchema = t.Object({
	on_break: t.Boolean(),
	break_since: t.Optional(t.Union([t.String(), t.Null()])),
	/** Break seconds today (an open break counts up to now). */
	today_seconds: t.Number(),
	today_count: t.Number(),
});

const breakSchema = t.Object({
	_id: t.String(),
	admin: t.Union([
		t.String(),
		t.Object({
			_id: t.String(),
			name: t.Optional(t.String()),
			phone: t.Optional(t.String()),
		}),
		t.Null(),
	]),
	started_at: t.String(),
	ended_at: t.Optional(t.Union([t.String(), t.Null()])),
	/** Seconds; for an open break, seconds so far. */
	duration: t.Number(),
	is_open: t.Boolean(),
	createdAt: t.String(),
	updatedAt: t.String(),
});

/** One row per doctor for a day: how long they were on break. */
const summarySchema = t.Object({
	admin: t.Object({
		_id: t.String(),
		name: t.Optional(t.String()),
		phone: t.Optional(t.String()),
	}),
	on_break: t.Boolean(),
	break_since: t.Optional(t.Union([t.String(), t.Null()])),
	total_seconds: t.Number(),
	count: t.Number(),
});

export default {
	meta: {
		name: name,
		detail: breakSchema,
		module: ModuleId.IVR_CALL_REQUESTS,
	},
	status: {
		response: {
			200: t.Object(
				{ status: t.Boolean(), message: t.String(), data: statusSchema },
				{ description: `${name} status response` },
			),
		},
		detail: { operationId: "status" },
	},
	setStatus: {
		body: t.Object({ on_break: t.Boolean() }),
		response: {
			200: t.Object(
				{ status: t.Boolean(), message: t.String(), data: statusSchema },
				{ description: `${name} set status response` },
			),
		},
		detail: { operationId: "setStatus" },
	},
	list: {
		query: t.Object({
			page: t.String(),
			size: t.String(),
			admin: t.Optional(t.String()),
			/** YYYY-MM-DD, inclusive. */
			from: t.Optional(t.String()),
			to: t.Optional(t.String()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(breakSchema),
					meta: MetaPaginationSchema,
				},
				{ description: `${name} list response` },
			),
		},
		detail: { operationId: "list" },
	},
	summary: {
		query: t.Object({
			/** YYYY-MM-DD; today when omitted. */
			date: t.Optional(t.String()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(summarySchema),
				},
				{ description: `${name} summary response` },
			),
		},
		detail: { operationId: "summary" },
	},
};
