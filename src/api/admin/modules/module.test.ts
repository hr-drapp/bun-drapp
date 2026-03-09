import { connectDB } from "src/db/mongo";
import Admin from "src/models/drapp/Admin";
import Role from "src/models/drapp/Role";

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
