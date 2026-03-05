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

export const SpinnerResultSchema = t.Object({
	_id: t.String(),
	game_time: t.Object({
		start: t.String(),
		end: t.String(),
		game: t.Object({
			name: t.String(),
		}),
		_id: t.String(),
	}),
	number: t.Object({ text: t.String() }),
});

export const UpcomingGameSchema = t.Object({
	_id: t.String(),
	game: GameSchema,
	start: t.String(),
	end: t.String(),
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
						upcomingGames: t.Array(UpcomingGameSchema),
						games: t.Array(
							t.Object({
								game: t.Object({ name: t.String() }),
								game_time_1: t.Array(
									t.Object({ end: t.String(), result_text: t.String() }),
								),
								game_time_2: t.Array(
									t.Object({ end: t.String(), result_text: t.String() }),
								),
								numbers: t.Array(
									t.Object({
										text: t.String(),
										texts: t.String(),
									}),
								),
							}),
						),
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
	games_results: {
		query: t.Object({
			date: t.Optional(t.String()),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Object({
						games: t.Array(
							t.Object({
								game: t.Object({ name: t.String() }),
								game_time_1: t.Array(
									t.Object({ end: t.String(), result_text: t.String() }),
								),
								game_time_2: t.Array(
									t.Object({ end: t.String(), result_text: t.String() }),
								),
								numbers: t.Array(
									t.Object({
										text: t.String(),
										texts: t.String(),
									}),
								),
							}),
						),
					}),
				},
				{
					description: `${name} games_results response`,
				},
			),
		},
		detail: {
			operationId: "games_results",
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
					data: t.Array(UpcomingGameSchema),
				},
				{
					description: `${name} upcoming_games response`,
				},
			),
		},
		detail: {
			operationId: "upcoming_games",
		},
	},
};
