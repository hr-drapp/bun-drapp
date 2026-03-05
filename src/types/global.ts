// eslint-disable-next-line @typescript-eslint/no-explicit-any
type APIResponse<TData = any> =
	| {
			status: true;
			data: TData;
	  }
	| APIError;

type APIError = {
	status: false;
	message: string;
	errors?: string;
};

export type { APIError, APIResponse };
