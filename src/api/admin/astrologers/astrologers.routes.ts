import Elysia, { t } from "elysia";
import { isAdminAuthenticated } from "src/guard/auth.guard";
import UserClass from "src/models/User";
import { customError } from "src/utils/AppErr";
import { HashPassword, VerifyPassword } from "src/utils/auth";
import jwt from "src/utils/jwt";
import { R } from "src/utils/response-helpers";
import astrologersSchema from "./astrologers.schema";
import Admin from "src/models/drapp/Admin";
import AstrologerClass from "src/models/Astrologer";
import { createElysia } from "src/utils/createElysia";

export default createElysia({ prefix: "/astrologers" }).guard(
	{
		detail: {
			tags: ["Astrologers"],
		},
		beforeHandle: isAdminAuthenticated,
	},
	(app) =>
		app
			.get(
				"/",
				async ({ query }) => {
					const page = parseInt(query.page);
					const size = parseInt(query.size);

					const list = await AstrologerClass.find({})
						.skip(page * size)
						.limit(page);

					const total = await AstrologerClass.countDocuments({});

					const pages = Math.ceil(total / size);

					return R("astrologer list data", list, true, {
						pages: pages,
						total: total,
						page: page,
						size: size,
					});
				},
				astrologersSchema.list,
			)
			.get(
				"/detail",
				async ({ query }) => {
					const { id } = query;

					const entry = await AstrologerClass.findById(id);

					if (!entry) {
						return customError("no found");
					}

					await entry?.populate([
						{
							path: "category",
						},
						{
							path: "sub_category",
						},
						{
							path: "country",
						},
					]);

					return R("astrologer detail", entry);
				},
				astrologersSchema.detail,
			)

			.post(
				"/",
				async ({ body }) => {
					const entry = await AstrologerClass.create(body);

					return R("entry updated", entry);
				},
				astrologersSchema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {
					const entry = await AstrologerClass.findByIdAndUpdate(query.id, body);

					return R("entry updated", entry);
				},
				astrologersSchema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await AstrologerClass.findByIdAndDelete(query.id);

					return R("entry updated", entry);
				},
				astrologersSchema.delete,
			),
);
