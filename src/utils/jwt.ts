import jwt from "jsonwebtoken";
import env from "src/config/env";

export default {
	sign: (payload: object) => {
		const token = jwt.sign(payload, env.secret);
		return token;
	},

	verify: (token: string): { _id: string; admin: boolean } => {
		const payload = jwt.verify(token, env.secret) as any;
		return payload;
	},
};
