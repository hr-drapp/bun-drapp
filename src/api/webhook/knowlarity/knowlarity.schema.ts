import { t } from "elysia";

const name = "get-agent";

const callParams = {
	caller_number: t.Optional(t.String()),
	knowlarity_number: t.Optional(t.String()),
	call_uuid: t.Optional(t.String()),
	call_start_time: t.Optional(t.String()),
};

const getAgent = {
	headers: t.Object({
		"x-api-key": t.Optional(t.String()),
	}),
	// Optional so a malformed call still reaches the handler and gets logged.
	body: t.Object(callParams),
	response: {
		200: t.Object(
			{
				status: t.Boolean(),
				message: t.String(),
				data: t.Union([
					t.Null(),
					t.Object({
						is_registered: t.Boolean(),
						agent_number: t.String(),
						hold_sound: t.String(),
					}),
				]),
			},
			{ description: `${name} response, tells the IVR which agent to dial` },
		),
		401: t.Object({
			status: t.Boolean(),
			message: t.String(),
			data: t.Null(),
		}),
	},
	detail: { operationId: "getAgent" },
};

export default {
	meta: {
		name: name,
	},
	// ── IVR routing lookup (Knowlarity calls this before connecting) ──
	getAgent,
	// Same lookup over GET, call params come from the query string.
	getAgentQuery: {
		headers: getAgent.headers,
		query: t.Object(callParams),
		response: getAgent.response,
		detail: { operationId: "getAgentQuery" },
	},
};
