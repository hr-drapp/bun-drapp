import mongoose from "mongoose";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

type SchemaField = {
	path: string;
	type: string;
	required: boolean;
	unique: boolean;
	index: boolean;
	enumValues: any[];
	ref: string | null;
	array: boolean;
	default: string | null;
};

type SchemaModel = {
	model: string;
	collection: string;
	timestamps: boolean;
	fields: SchemaField[];
	indexes: { spec: any; options: any }[];
	count: number | null;
};

const modelFilesCache = {
	loaded: false,
	files: [] as string[],
};

const safeDefault = (value: unknown): string | null => {
	if (value === undefined) return null;
	if (value === null) return "null";

	if (typeof value === "function") {
		return `[Function ${value.name || "anonymous"}]`;
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);

	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
};

const normalizeRef = (rawRef: unknown): string | null => {
	if (!rawRef) return null;
	if (typeof rawRef === "string") return rawRef;

	if (typeof rawRef === "function") {
		try {
			const resolved = rawRef();
			if (typeof resolved === "string") return resolved;
			if (typeof resolved === "function" && resolved.name) return resolved.name;
			if (resolved && typeof resolved === "object" && "name" in resolved) {
				return String((resolved as { name?: string }).name || "");
			}
		} catch {
			// noop
		}

		return rawRef.name || "FunctionRef";
	}

	if (typeof rawRef === "object" && rawRef && "name" in (rawRef as Record<string, unknown>)) {
		return String((rawRef as { name?: string }).name || "");
	}

	return String(rawRef);
};

const resolveType = (pathObj: any): string => {
	if (!pathObj) return "Unknown";

	const base = pathObj.instance || pathObj.constructor?.name || "Unknown";

	if (pathObj.$isMongooseArray || pathObj.instance === "Array") {
		const casterInstance = pathObj.caster?.instance || pathObj.caster?.constructor?.name || "Mixed";
		return `Array<${casterInstance}>`;
	}

	if (pathObj.$isSingleNested) {
		return "Subdocument";
	}

	return base;
};

const listModelFiles = async () => {
	const files = new Set<string>();

	const tsGlob = new Bun.Glob("src/models/**/*.ts");
	for await (const file of tsGlob.scan(".")) {
		if (!file.endsWith(".d.ts")) files.add(file);
	}

	if (files.size === 0) {
		const jsGlob = new Bun.Glob("src/models/**/*.js");
		for await (const file of jsGlob.scan(".")) {
			files.add(file);
		}
	}

	return [...files].sort();
};

const importAllModelsOnce = async () => {
	if (modelFilesCache.loaded) {
		return modelFilesCache.files;
	}

	const files = await listModelFiles();
	for (const file of files) {
		await import(pathToFileURL(resolve(process.cwd(), file)).href);
	}

	modelFilesCache.loaded = true;
	modelFilesCache.files = files;

	return files;
};

const mapModel = async (model: any): Promise<SchemaModel> => {
	const schema = model.schema;
	const fields: SchemaField[] = Object.entries(schema.paths)
		.filter(([key]) => key !== "__v")
		.map(([key, pathObj]: [string, any]) => {
			const options = pathObj.options || {};
			const isArray = Boolean(pathObj.$isMongooseArray || pathObj.instance === "Array");
			const enumValues = Array.isArray(pathObj.enumValues) ? pathObj.enumValues : [];
			const ref = normalizeRef(options.ref ?? pathObj.caster?.options?.ref);

			return {
				path: key,
				type: resolveType(pathObj),
				required: typeof options.required === "function" ? true : Boolean(options.required),
				unique: Boolean(options.unique),
				index: Boolean(options.index),
				enumValues,
				ref,
				array: isArray,
				default: safeDefault(options.default),
			};
		});

	let count: number | null = null;
	try {
		count = await model.estimatedDocumentCount();
	} catch {
		count = null;
	}

	return {
		model: model.modelName,
		collection: model.collection.name,
		timestamps: Boolean(schema.options?.timestamps),
		fields,
		indexes: schema.indexes().map(([spec, options]: [any, any]) => ({ spec, options })),
		count,
	};
};

export const buildRealtimeSchemaData = async () => {
	const importedModelFiles = await importAllModelsOnce();

	const models = Object.values(mongoose.models).sort((a: any, b: any) =>
		a.modelName.localeCompare(b.modelName),
	);

	const mappedModels = await Promise.all(models.map(mapModel));
	const knownModels = new Set(mappedModels.map((item) => item.model));

	const edges = mappedModels.flatMap((model) =>
		model.fields
			.filter((field) => Boolean(field.ref))
			.map((field) => ({
				source: model.model,
				target: field.ref as string,
				field: field.path,
				present: knownModels.has(field.ref as string),
			})),
	);

	return {
		generatedAt: new Date().toISOString(),
		database: mongoose.connection.name || "not-connected",
		importedModelFiles,
		modelCount: mappedModels.length,
		edgeCount: edges.length,
		models: mappedModels,
		edges,
	};
};
