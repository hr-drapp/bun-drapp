export function R(
	message: String | any,
	data?: any,
	status?: boolean,
	meta?: any,
) {
	const object = {
		status: status ?? true,
		message: message,
		data: data ? data : data === null ? null : {},
		...(meta && {
			meta: meta ?? {},
		}),
	};

	return object;
}

export interface CustomRequest extends Request {
	params: any;
	body: any;
	query: any;
}

// export function asyncWrapper(
// 	callback: (req: CustomRequest, res: Response) => Promise<any>,
// ) {
// 	return function (req: Request, res: Response) {
// 		callback(req, res)
// 			.then((d) => res.send(d))
// 			.catch((err: any) => {
// 				console.error("err: ", err);
// 				return res.send(R(false, err?.message));
// 			});
// 	};
// }

/*
	Post.findAndCountAll({
		where: {...},
		order: [...],
		limit: 5,
		offset: 0,
	}).then(function (result) {
		res.render(...);
	});
*/
