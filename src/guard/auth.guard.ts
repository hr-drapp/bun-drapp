import Elysia from "elysia";
import { routeMap } from "src";
import Admin from "src/models/clicknic/Admin";
import { abilityHttpMap } from "src/models/clicknic/Role";
import { APIResponse } from "src/types/global";
import { buildScopedQuery } from "src/utils/access-grants";
import JWT from "src/utils/jwt";

const attachAccessBuilder = (ctx: any, user: any) => {
	ctx.buildAccessQuery = (resource: any, baseFilter?: any, options?: any) =>
		buildScopedQuery({
			...(options ?? {}),
			user,
			resource,
			baseFilter,
		});
};
export const isAdminAuthenticated = async (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Context: any,
) => {
	const { set, headers, request } = Context;
	// console.log("/!\\ AUTHENTICATED GUARD /!\\");

	if (!headers!.authorization) {
		// console.log("@Error: No access token", headers);
		set.status = 401;
		return {
			status: false,
			message: "Unauthorized",
			data: "No access token",
		};
	}

	let token = headers.authorization.replace("Bearer ", "");

	const jwt = JWT.verify(token);
	if (!jwt) {
		// console.log("@Error: Invalid access token", jwt);
		set.status = 401;
		return {
			status: false,
			message: "Unauthorized.",
			data: "Invalid access token",
		};
	}

	const { _id } = jwt;
	if (!_id) {
		// console.log("@Error: Invalid access token", _id);
		set.status = 401;
		return {
			status: false,
			message: "Unauthorized",
			data: "access token is empty",
		};
	}

	const user = await Admin.findById(jwt._id).populate(["role", "doctor"]);

	if (!user) {
		set.status = 401;

		return {
			status: false,
			message: "Unauthorized",
			data: "User did not match",
		};
	}

	// const clientIP = request.headers.get("x-forwarded-for");

	// if (user.ip && user.ip != clientIP) {
	// 	set.status = 401;

	// 	return {
	// 		status: false,
	// 		message: "Unauthorized",
	// 		data: "User not found",
	// 	};
	// }

	// const userContext = new Elysia({ name: "user" }).decorate("user", user);
	Context.user = user;

	// console.log("user", userContext);

	// return {
	// 	status: true,
	// 	data: user,
	// };

	const meta = routeMap.get(Context.path);

	if (!(user.role as any).super_admin) {
		// console.log(
		// 	"User role Level",
		// 	(user.role as any)?.level,
		// 	"User Permission",
		// 	(user.role as any).permissions,
		// );
		// console.log("User Permission", user?.permissions);
		// console.log("Meta", meta);

		const moduleId = `${meta?.modules[0]}`;
		// console.log("ModuleId", moduleId);

		const permission =
			(user as any)?.permissions?.[moduleId]?.ability ??
			(user.role as any)?.permissions?.[moduleId]?.ability;

		if (!permission) {
			return {
				status: false,
				message: "lack of authorization",
				data: [],
			};
		}

		const method = (Context.request.method as string).toUpperCase();

		const ability = (abilityHttpMap as any)[method];

		if (!ability) {
			return {
				status: false,
				message: "invalid authorization method",
				data: [],
			};
		}

		if (!permission.includes(ability)) {
			return {
				status: false,
				message: "Permission denied",
				data: [],
			};
		}
	}
	// attachAccessBuilder(Context, user);
};
