import { t } from "elysia";
import { GameCategorySchema } from "../game-category/game-category.schema";
import { NumbersSchema } from "../numbers/numbers.schema";
import { GameSchema } from "../games/games.schema";

export const name = "GamesNumber";
export const GameNumberSchema = t.Object({
	_id: t.String(),
	number: NumbersSchema,
	game: GameSchema,
});
export const GameTimeSchema = t.Object({
	_id: t.Optional(t.String()),
	game: GameNumberSchema,
	start_time: t.Number(),
	end_time: t.Number(),
	time_range: t.Array(t.Array(t.Number())),
});

const MetaPaginationSchema = t.Object({
	pages: t.Number(),
	total: t.Number(),
	page: t.Number(),
	size: t.Number(),
});

export default {
	list: {
		query: t.Object({
			page: t.String(),
			size: t.String(),
			game: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(GameNumberSchema),
					meta: MetaPaginationSchema,
				},
				{
					description: `${name} list response`,
				},
			),
		},
		detail: {
			operationId: "GameNumberslist",
		},
	},
	create: {
		body: t.Object({
			number: t.String(),
			game: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: GameNumberSchema,
				},
				{
					description: `${name} create response`,
				},
			),
		},
		detail: {
			operationId: "create",
		},
	},
	update: {
		body: t.Optional(
			t.Object({
				name: t.String(),
				game_category: t.String(),
			}),
		),
		query: t.Object({
			id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: GameNumberSchema,
				},
				{
					description: `${name} update response`,
				},
			),
		},
		detail: {
			operationId: "update",
		},
	},
	delete: {
		query: t.Object({
			id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: GameNumberSchema,
				},
				{
					description: `${name} delete response`,
				},
			),
		},
		detail: {
			operationId: "delete",
		},
	},
	timeout_game: {
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(GameNumberSchema),
				},
				{
					description: "TimeOut Game List",
				},
			),
		},
		detail: {
			operationId: "TimeoutGame",
		},
	},
	game_time_list: {
		query: t.Object({
			game_id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(GameTimeSchema),
				},
				{
					description: "Game Time List",
				},
			),
		},
		detail: {
			operationId: "GameTimeList",
		},
	},
	game_time_add: {
		query: t.Object({
			game_id: t.String(),
		}),
		body: t.Object({
			time_range: t.Array(t.Array(t.Number())),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: GameTimeSchema,
				},
				{
					description: "Game Time Add",
				},
			),
		},
		detail: {
			operationId: "GameTimeAdd",
		},
	},
};
