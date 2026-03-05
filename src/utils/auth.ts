import bcrypt from "bcryptjs";

export const HashPassword = (password: string) => {
	return bcrypt.hashSync(password, 10);
};

export const VerifyPassword = (password: string, hash: string) => {
	if (!password) return false;
	return bcrypt.compareSync(password, hash);
};
