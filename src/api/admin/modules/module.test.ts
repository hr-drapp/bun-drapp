import { connectDB } from "src/db/mongo";
import Admin from "src/models/clicknic/Admin";
import Role from "src/models/clicknic/Role";

await connectDB("db");

const user = await Admin.findOne({
	phone: "9983396152",
});

if (user) {
	await user.populate([
		{
			path: "role",
		},
	]);
	console.log("🚀 ~ Role.modelName:", Role.modelName);

	console.log("🚀 ~ user:", user);
}
