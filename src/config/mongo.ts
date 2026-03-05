import dotenv from "dotenv";

dotenv.config();

export default {
	uri: process.env.DB_HOST || "mongodb://127.0.0.1:27017/matkactrl",
	db_name: process.env.DB_NAME || "astro"
};
