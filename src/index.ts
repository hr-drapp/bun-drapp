process.env.TZ = "Asia/Kolkata";

import { Elysia, HTTPMethod, Context, t } from "elysia";
import { html } from "@elysiajs/html";
// import { helmet } from "elysia-helmet";
// import { apiRoutes } from "@api/index";
// import { auth } from "@auth/auth.controller";
// import { jwtAccessSetup, jwtRefreshSetup } from "@auth/guards/setup.jwt";
import cookie from "@elysiajs/cookie";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { connectDB } from "./db/mongo";
import AppErr from "./utils/AppErr";
import { R } from "./utils/response-helpers";
import { adminRoutes } from "./api/admin/admin.index";
import { staticPlugin } from "@elysiajs/static";
import { bearer } from "@elysiajs/bearer";
import { ModuleId } from "./config/modules";

declare module "elysia" {}

const api = new Elysia({ normalize: false }).decorate("user", null);

api.use(
	cors({
		methods: "*",
		origin: ({ headers }) => {
			return true;
		},
	}),
);
api.onError(({ error, code, set, ...rest }: any) => {
	// console.log("🚀 ~ api.onError ~ rest:", error);
	// console.log("🚀 ~ api.onError ~ error instanceof AppErr:", error?.appErr)

	if (error instanceof AppErr) {
		set.status = "OK";
		return R(error.message, null, false);
	}

	const errorType = "type" in error ? error.type : "internal";

	if (errorType == "internal") {
		set.status = "OK";
		return { status: false, message: error.message, data: null };
	} else if (errorType == "response") {
		set.status = "OK";
		const result = JSON.parse(error?.message);
		return result?.found;
	} else if (["body", "query"].includes(errorType)) {
		set.status = "OK";
		const result = JSON.parse(error?.message);
		const message = result.errors
			.map(
				(err: any) =>
					`${err.path.replace("/", "").replace("_", " ").toUpperCase()} ${
						err.message
					}`,
			)
			.join("\n");

		return { status: false, message: message, data: null };
	}
	return { status: false, message: error.message, data: null };
});

api.onTransform(({ body = {}, params = {}, query = {} }) => {
	// console.log("Transfer Body",body);

	const removeWasteFromObject = (obj: Record<string, any> | any) => {
		for (let key in obj) {
			let value = obj[key];
			if (typeof value === "object" && !Array.isArray(value)) {
				// removeWasteFromObject(obj);
				continue;
			}

			if (value === "") {
				delete obj[key];
			}
		}
	};
	removeWasteFromObject(body);
	removeWasteFromObject(params);
	removeWasteFromObject(query);
});

api.use(bearer());

// Setup

api.onAfterHandle((ctx) => {
	const isJsonPath = ctx.path.includes("/json");
	const normalizeContentType = (type: string) => {
		switch (type) {
			case "json":
			case "application/json":
				return "application/json";
			case "text":
			case "text/plain":
				return "text/plain";
			case "formdata":
			case "multipart/form-data":
				return "multipart/form-data";
			case "urlencoded":
			case "application/x-www-form-urlencoded":
				return "application/x-www-form-urlencoded";
			case "arrayBuffer":
			case "application/octet-stream":
				return "application/octet-stream";
			default:
				return type;
		}
	};
	const toOpenApiPath = (path: string) =>
		path
			.split("/")
			.map((segment) => {
				if (segment.startsWith(":")) {
					let name = segment.slice(1);
					if (name.endsWith("?")) name = name.slice(0, -1);
					return `{${name}}`;
				}
				return segment;
			})
			.join("/");
	const buildRequestBodyContentTypeOverrides = () => {
		const overrides = new Map<string, string[]>();
		for (const route of api.routes) {
			const rawType =
				(route.hooks as any)?.type ??
				(route.hooks as any)?.contentType ??
				(route.hooks as any)?.mediaType;
			if (!rawType) continue;

			const types = Array.isArray(rawType) ? rawType : [rawType];
			const normalized = types.map(normalizeContentType).filter(Boolean);
			if (!normalized.length) continue;

			const path = toOpenApiPath(route.path);
			overrides.set(`${route.method.toLowerCase()} ${path}`, normalized);
		}
		return overrides;
	};
	const pruneRequestBodyContentTypes = (doc: any) => {
		if (!doc?.paths) return;
		const overrides = buildRequestBodyContentTypeOverrides();
		for (const [path, methods] of Object.entries(doc.paths)) {
			for (const [method, operation] of Object.entries(methods as any)) {
				const requestBody = (operation as any)?.requestBody;
				const content = requestBody?.content;
				if (!content) continue;

				const allowed = overrides.get(`${method} ${path}`);
				if (!allowed?.length) continue;

				const filtered: Record<string, any> = {};
				for (const type of allowed) {
					if (content[type]) filtered[type] = content[type];
				}
				if (Object.keys(filtered).length > 0) {
					requestBody.content = filtered;
				}
			}
		}
	};
	const handleJsonSchema = (obj: any) => {
		for (let key in obj) {
			let value = obj[key];
			if (typeof value == "object" && !Array.isArray(value)) {
				if (`${key}`.startsWith("/admin")) {
					continue;
				}
				if (value.description == "upload") {
					// value.consumes = ["multipart/form-data"];
					delete obj[key];
				}
				if (value?.description == "file") {
					for (let jkey in value) {
						if (jkey != "type") {
							delete value[jkey];
						}
					}
					value.type = "file";
					// value.format = "binary";
				}
				handleJsonSchema(obj[key]);
			}
		}
		return obj;
	};

	if (isJsonPath) {
		handleJsonSchema(ctx.response);
		pruneRequestBodyContentTypes(ctx.response);
	}
});
api
	.use(
		swagger({
			path: "/swagger-app",
			provider: "scalar",
			exclude: new RegExp(/^\/admin.*/),
			swaggerOptions: {
				persistAuthorization: true,
			},
		}),
	)

	.use(
		swagger({
			path: "/swagger-admin",
			provider: "scalar",
			autoDarkMode: true,
			exclude: new RegExp(/^(?!\/admin).*/),
			swaggerOptions: {
				persistAuthorization: true,
			},
		}),
	)
	.use(
		swagger({
			path: "/swagger-webhook",
			provider: "scalar",
			autoDarkMode: true,
			exclude: new RegExp(/^(?!\/webhook).*/),
			swaggerOptions: {
				persistAuthorization: true,
			},
		}),
	)
	.use(
		swagger({
			path: "/swagger-web",
			provider: "scalar",
			autoDarkMode: true,
			exclude: new RegExp(/^(?!\/v1-web).*/),
			swaggerOptions: {
				persistAuthorization: true,
			},
		}),
	);

//Security;

// api.trace(async ({ handle, context, response }) => {
// 	console.log("🚀 ~ api.trace ~ parse:", await response);
// 	const { time, end } = await handle;

// 	console.log(`${context.path} - ${((await end) - time).toFixed(2)} ms`);
// });
// api.use(helmet());

// Routes

api.use(adminRoutes);

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NjBhZjJmZDY1NDZlMGUxOTFjZmMzNGEiLCJlbWFpbCI6ImhhcnNoLmRxb3RAZ21haWwuY29tIiwicGhvbmUiOiI5OTgzMzk2MTUyIiwiaWF0IjoxNzEyNTk3NDQxfQ.FuZIJkXEN8jvikzJKeiBFS4RAFkI09CibZsVREmVQDQ
api.get(
	"/admin-doc",
	() => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Elements in HTML</title>
  
    <script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">
  </head>
  <body>

    <elements-api
      apiDescriptionUrl="/swagger-admin/json"
      router="hash"
    />

  </body>
</html>

`,
	{
		response: {
			200: t.Any({ description: "something" }),
		},
	},
);

api.onError((err) => {
	// console.log("🚀 ~ api.onError ~ err:", err);
});

export const routeMap: Map<any, { modules: ModuleId[] }> = new Map();

for (let route of api.routes) {
	if (route.hooks.detail?.summary) {
		routeMap.set(route.path, JSON.parse(route.hooks.detail?.summary));
	}
}

connectDB("APP").then((d) => {
	if (process.env?.APP_ENV !== "development") {
	}
	api.listen(process.env.APP_PORT || 8080);
	console.log(
		`🦊 Elysia is running at ${api.server?.hostname}:${
			process.env.APP_PORT || 8080
		}`,
	);
});
