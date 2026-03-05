import dotenv from "dotenv";

dotenv.config();

export default {
	host: process.env.REDIS_DB_HOST || "",
	username: process.env.REDIS_DB_USER || "",
	password: process.env.REDIS_DB_PASSWORD || "",
	port: parseInt(process.env.REDIS_DB_PORT || ""),
	keyPrefix: process.env.REDIS_KEY_PREFIX || "",
};
