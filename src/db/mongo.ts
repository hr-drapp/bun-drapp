import mongoose from "mongoose";
import env from "src/config/mongo";
import { seeder } from "./seeder";

export async function connectDB(thread: any) {
	try {
		mongoose.set("strict", false);
		mongoose.set("strictQuery", false);
		mongoose.set("strictPopulate", false);
		const db = await mongoose.connect(env.uri, { dbName: env.db_name });
		console.log(`Database is connected from ${thread} to:`, db.connection.name);
		seeder()
		return db;

	} catch (error) {
		console.log("error: ", error);
	}
}
