import { isAdminAuthenticated } from "src/guard/auth.guard";
import { customError } from "src/utils/AppErr";
import { R } from "src/utils/response-helpers";
import { createElysia } from "src/utils/createElysia";
/** can be modified */
import Product from "src/models/Product";
import schema from "./product.schema";
import { uploadFile } from "src/utils/upload";
const name = "product";

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
					let search = query?.search;

					if (search) {
						search = new RegExp(search, "i") as any;

					}

					const list = await Product.find({
						...(search && {
							$or: [

								{
									name: {
										$regex: search
									}
								},

								{
									description: {
										$regex: search
									}
								},

							]
						}),
					})
						.skip(page * size)
						.limit(page);

					const total = await Product.countDocuments({});

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

					const entry = await Product.findById(id);

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




						const { name } = await uploadFile(image)

						imageNameList.push(name)

					}

					body.images = imageNameList as any;

					const entry = await Product.create(body);


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



							const { name } = await uploadFile(image)

							imageNameList.push(name)

						}

						body.images = imageNameList as any;
					}

					const entry = await Product.findByIdAndUpdate(query.id, body);

					return R("entry updated", entry);
				},
				schema.update,
			)
			.delete(
				"/",
				async ({ query }) => {
					const entry = await Product.findByIdAndDelete(query.id);

					return R("entry updated", entry);
				},
				schema.delete,
			),
);
