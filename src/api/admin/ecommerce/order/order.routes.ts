import { isAdminAuthenticated } from "src/guard/auth.guard";
import { customError } from "src/utils/AppErr";
import { R } from "src/utils/response-helpers";
import { createElysia } from "src/utils/createElysia";
/** can be modified */
import Order from "src/models/Order";
import schema from "./order.schema";
const name = "order";

export default createElysia({ prefix: `/${name}` }).guard(
	{
		detail: {
			tags: [name],
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

					const list = await Order.find({})
						.skip(page * size)
						.limit(page);

					const total = await Order.countDocuments({});

					const pages = Math.ceil(total / size);

					return R(`${name} list data`, list, true, {
						pages: pages,
						total: total,
						page: page,
						size: size,
					});
				},
				schema.list,
			).get(
				"/detail",
				async ({ query }) => {
					const { id } = query;

					const entry = await Order.findById(id);

					if (!entry) {

						return customError("no found");
					}



					return R("detail", entry);
				},
				schema.detail,
			)

			.post(
				"/",
				async ({ body }) => {
					let imageNameList = []

					for (let image of body.images) {


						await Bun.write(
							process.cwd() + "/public/images/" + image.name,
							body.images,
						);

						imageNameList.push(image.name)

					}

					body.images = imageNameList as any;

					const entry = await Order.create(body);


					return R("entry updated", entry);
				},
				schema.create,
			)
			.put(
				"/",
				async ({ body, query }) => {

					if (body.images?.length) {

						let imageNameList = []

						for (let image of body.images) {


							await Bun.write(
								process.cwd() + "/public/images/" + image.name,
								body.images,
							);

							imageNameList.push(image.name)

						}

						body.images = imageNameList as any;
					}

					const entry = await Order.findByIdAndUpdate(query.id, body);

					return R("entry updated", entry);
				},
				schema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await Order.findByIdAndDelete(query.id);

					return R("entry updated", entry);
				},
				schema.delete,
			),
);
