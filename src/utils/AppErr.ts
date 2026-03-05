export default class AppErr extends Error {
	statusCode?: number;
	data?: any;
	appErr?: boolean;
	status?: boolean;

	constructor(message: string, statusCode?: number, data?: any) {
		super();
		this.message = message;
		this.statusCode = statusCode;
		this.data = null;
		this.appErr = true;
		this.status = false;
		if (data) {
			this.data = data;
		} else {
			this.data = null;
		}
		// this.stack = "";
	}
}

export const customError = (msg: string, data?: any): never => {
	throw new AppErr(msg, data);
};
