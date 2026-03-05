import { t } from "elysia";

const ModuleSchema = t.Object({
	_id: t.String(),
	name: t.String(),
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
			type: t.Optional(t.String()),
			// page: t.Numeric(),
			// size: t.Numeric(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: t.Array(ModuleSchema),
					meta: MetaPaginationSchema,
				},
				{
					description: "Module Response",
				},
			),
		},
		detail: {
			operationId: "moduleList",
		},
	},
};
