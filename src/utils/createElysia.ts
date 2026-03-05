import { DocumentType, ReturnModelType } from "@typegoose/typegoose";
import { Elysia, t } from "elysia";
import { AdminClass } from "src/models/drapp/Admin";
import { AstrologerClass } from "src/models/Astrologer";
import { UserClass } from "src/models/User";

export const createElysia = (
	config?: ConstructorParameters<typeof Elysia>[0],
) =>
	new Elysia({
		...config,
		aot: process.env.RUNTIME === "bun",
		normalize: false,
	})
		.decorate(
			"user",
			{} as DocumentType<UserClass> &
				DocumentType<AdminClass> &
				DocumentType<AstrologerClass>,
		)
		.guard({
			headers: t.Object({
				authorization: t.Optional(t.String({})),
			}),
		});
