import { FilterQuery, Types } from "mongoose";
import AccessGrant, {
	AccessGrantClass,
	AccessGrantResource,
} from "src/models/drapp/AccessGrant";
import { RoleLevel } from "src/models/drapp/Role";
import redis from "src/db/redis";

const CACHE_PREFIX = "matkactrl:access-grant";
const CACHE_TTL_SECONDS = 60;

const buildCacheKey = (
	granteeId: Types.ObjectId,
	resource: AccessGrantResource,
) => `${CACHE_PREFIX}:${granteeId.toString()}:${resource}`;

const isGrantExpired = (grant?: AccessGrantClass | null) =>
	!!grant?.expires_at && grant.expires_at.getTime() <= Date.now();

export const invalidateAccessGrantCache = async (
	granteeId: Types.ObjectId,
	resource: AccessGrantResource,
) => {
	await redis.del(buildCacheKey(granteeId, resource));
};

const fetchGrant = async (
	granteeId: Types.ObjectId,
	resource: AccessGrantResource,
) => {
	const cacheKey = buildCacheKey(granteeId, resource);
	const cached = await redis.get(cacheKey);

	if (cached && cached != "null") {
		const parsed = JSON.parse(cached) as AccessGrantClass | null;
		if (parsed && isGrantExpired(parsed)) {
			await redis.del(cacheKey);
		} else {
			return parsed;
		}
	}

	console.log("🚀 ~ fetchGrant ~ resource:", resource);
	console.log("🚀 ~ fetchGrant ~ granteeId:", granteeId);
	const grant = await AccessGrant.findOne({
		grantee: granteeId,
		resource,
		// $or: [{ expires_at: null }, { expires_at: { $gt: new Date() } }],
	})
		.lean()
		.exec();

	await redis.set(
		cacheKey,
		JSON.stringify(grant ?? null),
		"EX",
		CACHE_TTL_SECONDS,
	);

	return grant;
};

const shouldScopeByGrant = (user: any) => {
	if (!user || user.super_admin) {
		return false;
	}

	if (!user.role?.level) {
		return false;
	}

	return user.role.level >= RoleLevel.L3;
};

const ensureObjectId = (value: any) => {
	if (value instanceof Types.ObjectId) {
		return value;
	}

	if (typeof value === "string" && Types.ObjectId.isValid(value)) {
		return new Types.ObjectId(value);
	}

	return value;
};

export interface BuildScopedQueryOptions<T> {
	user: {
		_id: Types.ObjectId;
		role?: { level?: number };
		super_admin?: boolean;
	};
	resource: AccessGrantResource;
	baseFilter?: FilterQuery<T>;
	createdByField?: string;
	resourceIdField?: string;
	topic?: string;
}

export const buildScopedQuery = async <T = any>({
	user,
	resource,
	baseFilter,
	createdByField = "created_by",
	resourceIdField = "_id",
}: BuildScopedQueryOptions<T>) => {
	const filter: FilterQuery<T> = { ...(baseFilter ?? {}) };

	if (!shouldScopeByGrant(user)) {
		return filter;
	}

	const grant = await fetchGrant(user._id, resource);

	const scopedOr: FilterQuery<T>[] = [];

	if (createdByField) {
		scopedOr.push({
			[createdByField]: ensureObjectId(user._id),
		} as FilterQuery<T>);
	}

	if (grant?.resource_ids?.length) {
		scopedOr.push({
			[resourceIdField]: {
				$in: grant.resource_ids.map((id) => ensureObjectId(id)),
			},
		} as FilterQuery<T>);
	}

	if (grant?.filters?.length) {
		for (const item of grant.filters) {
			if (!item?.field) {
				continue;
			}

			if (item.op === "$in") {
				const values = Array.isArray(item.value)
					? item.value.map(ensureObjectId)
					: [ensureObjectId(item.value)];
				scopedOr.push({
					[item.field]: { $in: values },
				} as FilterQuery<T>);
				continue;
			}

			scopedOr.push({
				[item.field]: ensureObjectId(item.value),
			} as FilterQuery<T>);
		}
	}

	if (!scopedOr.length) {
		return {
			...filter,
			[createdByField]: ensureObjectId(user._id),
		};
	}

	filter.$or = [
		...(Array.isArray(filter.$or)
			? filter.$or
			: filter.$or
			? [filter.$or]
			: []),
		...scopedOr,
	];

	return filter;
};
