import { t } from "elysia";
import { GameSchema } from "src/api/admin/games/games.schema";

export const name = "Game Time";

export const GameTimeSchema = t.Object({
	_id: t.String(),
	game: GameSchema,
	start: t.String(),
	end: t.String(),
	remaining_seconds: t.Number(),
	numbers: t.Array(
		t.Object({
			_id: t.String(),
			number: t.Object({
				_id: t.String(),
				text: t.String(),
			}),
		}),
	),
	result_id: t.String(),
});

export const GameTimeHisotrySchema = t.Object({
	game_time: GameTimeSchema,
	date: t.String(),
	results: t.Array(
		t.Object({
			date: t.String(),
			result_text: t.String(),
		}),
	),
	total_results: t.Number(),
	most_frequent: t.String(),
});

const MetaPaginationSchema = t.Object({
	pages: t.Number(),
	total: t.Number(),
	page: t.Number(),
	size: t.Number(),
});

const resultGameSchema = t.Object({
	_id: t.Optional(t.String()),
	game_time: GameTimeSchema,
	game_number: t.Optional(t.String()),
});

export default {
	list: {
		query: t.Object({
			page: t.String(),
			size: t.String(),
			game: t.Optional(t.String()),
			search: t.Optional(t.String()),
			group: t.Optional(t.String()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(GameTimeSchema),
					meta: MetaPaginationSchema,
				},
				{
					description: `${name} list response`,
				},
			),
		},
		detail: {
			operationId: "list",
		},
	},
	detail: {
		query: t.Object({
			id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: GameTimeSchema,
				},
				{
					description: `${name} detail response`,
				},
			),
		},
		detail: {
			operationId: "detail",
		},
	},
	history: {
		query: t.Object({
			id: t.String(),
			date: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: GameTimeHisotrySchema,
				},
				{
					description: `${name} history response`,
				},
			),
		},
		detail: {
			operationId: "history",
		},
	},
};
