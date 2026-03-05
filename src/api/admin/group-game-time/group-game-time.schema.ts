import { t } from "elysia";
import { GameCategorySchema } from "../game-category/game-category.schema";
import { GroupSchema } from "../group/group.schema";
import { GameTimeSchema } from "../games/games.schema";

const name = "GroupGameTime";

export const GroupGameTimeSchema = t.Object({
	_id: t.Optional(t.String()),
	group: GroupSchema,
	game_time: GameTimeSchema,
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
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(GroupGameTimeSchema),
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
	create: {
		body: t.Object({
			group: t.String(),
			game_time: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: GroupGameTimeSchema,
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
				group: t.String(),
				game_time: t.String(),
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
					data: GroupGameTimeSchema,
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
					data: GroupGameTimeSchema,
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
};
