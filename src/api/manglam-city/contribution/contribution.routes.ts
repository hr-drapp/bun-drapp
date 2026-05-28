import { R } from "src/utils/response-helpers";
import schema from "./contribution.schema";
import ManglamCityContribution from "src/models/ManglamCityContribution";
import { createElysia } from "src/utils/createElysia";

function maskPhone(phone: string): string {
	if (phone.length <= 4) return "****";
	return "*".repeat(phone.length - 4) + phone.slice(-4);
}

function maskName(name: string): string {
	const visible = Math.min(4, Math.ceil(name.length / 2));
	return (
		name.slice(0, visible) + "*".repeat(Math.max(0, name.length - visible))
	);
}

export default createElysia({ prefix: schema.meta.name }).guard(
	{
		detail: {
			tags: ["manglam-city"],
		},
	},
	(app) =>
		app
			.post(
				"/",
				async ({ body, request }) => {
					const ip =
						request.headers.get("x-forwarded-for") ||
						request.headers.get("x-real-ip") ||
						"";

					const entry = await ManglamCityContribution.create({
						name: body.name.trim(),
						phone: body.phone.trim(),
						amount: body.amount,
						...(body.area && { area: body.area.trim() }),
						ip,
					});

					return R("Entry submitted successfully", {
						_id: entry._id,
						name: entry.name,
						amount: entry.amount,
						createdAt: (entry as any).createdAt,
					});
				},
				schema.submit,
			)
			.get(
				"/",
				async ({ query }) => {
					const page = parseInt(query.page);
					const size = parseInt(query.size);

					const [list, total] = await Promise.all([
						ManglamCityContribution.find()
							.skip(page * size)
							.limit(size)
							.sort({ createdAt: -1 })
							.lean(),
						ManglamCityContribution.countDocuments(),
					]);
					console.log("🚀 ~ list:", list);

					const pages = Math.ceil(total / size);

					const masked = list.map((entry: any) => ({
						_id: entry._id,
						name: maskName(entry.name),
						phone: maskPhone(entry.phone),
						amount: entry.amount,
						area: entry.area,
						createdAt: entry.createdAt,
					}));

					//

					return R("contribution list data", masked, true, {
						pages,
						total,
						page,
						size,
					});
				},
				schema.list,
			)
			.get(
				"/analytics",
				async () => {
					const [result] = await ManglamCityContribution.aggregate([
						{
							$group: {
								_id: null,
								total_amount: { $sum: "$amount" },
								total_contributors: { $sum: 1 },
							},
						},
					]);

					return R("analytics data", {
						total_amount: result?.total_amount ?? 0,
						total_contributors: result?.total_contributors ?? 0,
					});
				},
				schema.analytics,
			),
);
