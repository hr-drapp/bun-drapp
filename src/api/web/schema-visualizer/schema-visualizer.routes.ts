import { createElysia } from "src/utils/createElysia";
import schema from "./schema-visualizer.schema";
import { R } from "src/utils/response-helpers";
import { buildRealtimeSchemaData } from "src/utils/schema-visualizer";

export default createElysia({ prefix: schema.meta.name }).guard(
	{
		detail: {
			tags: [schema.meta.tag],
		},
	},
	(app) =>
		app.get(
			"/schema-data",
			async () => {
				const schemaData = await buildRealtimeSchemaData();
				return R("schema data", schemaData);
			},
			schema.schema_data,
		),
);
