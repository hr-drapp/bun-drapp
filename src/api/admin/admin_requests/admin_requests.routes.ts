import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import rolesSchema from "./admin_requests.schema";
import AdminRequest, { AdminRequestStatus } from "src/models/AdminRequest";
import { createElysia } from "src/utils/createElysia";
import moment from "moment";
import Admin from "src/models/drapp/Admin";
import { randomInRange } from "src/utils/common";
import Role from "src/models/Role";

export default createElysia({ prefix: "/admin_requests" }).guard(
	{
		detail: {
			tags: ["Admin Requests"],
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.get(
				"/",
				async ({ query, user }) => {
					const page = parseInt(query.page);
					const size = parseInt(query.size);
					let search = query?.search;

					if (search) {
						search = new RegExp(search, "i") as any;
					}

					const list = await AdminRequest.find({
						...(search && {
							$or: [
								{
									name: {
										$regex: search,
									},
								},

								{
									phone: {
										$regex: search,
									},
								},

								{
									email: {
										$regex: search,
									},
								},
							],
						}),
					})
						// .select("-password")
						.skip(page * size)
						.limit(page)
						.sort({ createdAt: -1 })
						.lean();

					const total = await AdminRequest.countDocuments({});

					const pages = Math.ceil(total / size);

					return R("admin list data", list, true, {
						pages: pages,
						total: total,
						page: page,
						size: size,
					});
				},
				rolesSchema.list,
			)
			.put(
				"/",
				async ({ body, query, user }) => {
					const detail = await AdminRequest.findById(query.id);

					if (!detail) {
						return customError("Invalid Request");
					}

					if (detail.status === AdminRequestStatus.APPROVED) {
						return customError("Already Approved");
					}

					const password = randomInRange(9999, 9999999);

					let masterRole = await Role.findOne({
						name: "MASTER",
						super_admin: false,
					});

					const entry = await Admin.create({
						admin_create_limit: 5,
						expire_at: moment().add(1, "day"),
						name: detail.name,
						phone: detail.phone,
						email: detail.email,
						password: HashPassword(`${password}`),
						password_unhashed: password,
						role: masterRole?._id,
						super_admin: false,
					});
					detail.status = body.status;
					await detail.save();

					return R("entry updated", entry);
				},
				rolesSchema.update,
			)
			.delete(
				"/",
				async ({ query, user }) => {
					const entry = await AdminRequest.findOneAndDelete({
						_id: query.id,
					});

					return R("entry deleted", entry);
				},
				rolesSchema.delete,
			),
);
