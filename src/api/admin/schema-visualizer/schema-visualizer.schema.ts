import { t } from "elysia";

const name = "schema-visualizer";

const schemaDataShape = t.Object({
	generatedAt: t.String(),
	database: t.String(),
	importedModelFiles: t.Array(t.String()),
	modelCount: t.Number(),
	edgeCount: t.Number(),
	models: t.Array(t.Any()),
	edges: t.Array(t.Any()),
});

export default {
	meta: {
		name: `/${name}`,
		tag: "Schema Visualizer",
	},
	schema_data: {
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: schemaDataShape,
				},
				{
					description: `${name} schema data response`,
				},
			),
		},
		detail: {
			operationId: "schema_visualizer_schema_data",
		},
	},
};
