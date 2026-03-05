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
	auto_result: t.Optional(t.Boolean()),
	win_margin: t.Optional(t.Number()),
});

export const SpinnerResultSchema = t.Object({
	_id: t.String(),
	game_time: t.Object({
		start: t.String(),
		end: t.Number(),
		game: t.Object({
			name: t.String(),
		}),
	}),
	number: t.Object({ text: t.String() }),
	createdAt: t.String(),
});

export default {
	home_data: {
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Object({
						liveGames: t.Array(GameTimeSchema),
						recentResults: t.Array(SpinnerResultSchema),
						upcomingGames: t.Array(GameTimeSchema),
					}),
				},
				{
					description: `${name} home_data response`,
				},
			),
		},
		detail: {
			operationId: "home_data",
		},
	},
	idle_games: {
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(GameTimeSchema),
				},
				{
					description: `${name} idle_games response`,
				},
			),
		},
		detail: {
			operationId: "idle_games",
		},
	},
	live_games: {
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(GameTimeSchema),
				},
				{
					description: `${name} live_games response`,
				},
			),
		},
		detail: {
			operationId: "live_games",
		},
	},
	recent_result: {
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(SpinnerResultSchema),
				},
				{
					description: `${name} recent_result response`,
				},
			),
		},
		detail: {
			operationId: "recent_result",
		},
	},
	upcoming_games: {
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(GameTimeSchema),
				},
				{
					description: `${name} upcoming response`,
				},
			),
		},
		detail: {
			operationId: "upcoming_games",
		},
	},
};
