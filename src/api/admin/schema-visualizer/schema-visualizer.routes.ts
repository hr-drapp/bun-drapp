import { createElysia } from "src/utils/createElysia";
import schema from "./schema-visualizer.schema";
import { R } from "src/utils/response-helpers";
import { buildRealtimeSchemaData } from "src/utils/schema-visualizer";
import env from "src/config/env";

export default createElysia({ prefix: schema.meta.name }).guard(
	{
		detail: {
			tags: [schema.meta.name],
		},
	},
	(app) =>
		app.get(
			"/schema-data",
			async () => {
				if (process.env.APP_ENV === "development") {
					const schemaData = await buildRealtimeSchemaData();
					return R("schema data", schemaData);
				} else {
					return R("no schema data sorry");
				}
			},
			schema.schema_data,
		),
);
