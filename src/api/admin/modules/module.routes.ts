import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import schema from "./module.schema";
import Admin from "src/models/drapp/Admin";
import Role from "src/models/drapp/Role";
import { createElysia } from "src/utils/createElysia";
import {
	AdditionalModuleList,
	BasicModuleList,
	ModuleId,
	ModuleList,
	Summary,
} from "src/config/modules";

export default createElysia({ prefix: "/modules" }).guard(
	{
		detail: {
			tags: ["Module"],
			summary: Summary([ModuleId.ROLES_AND_PERMISSIONS]),
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app.get(
			"/",
			async ({ query }) => {
				const type = query.type;

				let list: typeof ModuleList = ModuleList;

				if (type === "all") {
					list = ModuleList;
				}

				if (type === "basic") {
					list = BasicModuleList;
				}

				if (type === "additional") {
					list = AdditionalModuleList;
				}

				return R("module list data", list, true);
			},
			schema.list,
		),
);
