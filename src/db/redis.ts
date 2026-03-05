import env from "src/config/redis";
import ioredis, { ChainableCommander, Redis } from "ioredis";

export interface CustomRedis extends Redis {
	getJson: (key: string) => Promise<any>;
	setJson: (key: string, value: any) => Promise<any>;
	execAsync: (mult: ChainableCommander) => Promise<any>;
}

const redis: any = new ioredis({
	username: env.username,
	host: env.host,
	password: env.password,
	port: env.port,
	keyPrefix: env.keyPrefix,
});

const getJson = async function (key: string) {
	let data: any = await redis.get(key);
	return JSON.parse(data);
};

const setJson = async function (key: string, value: any) {
	return await redis.set(key, JSON.stringify(value));
};

const execAsync = (mult: ChainableCommander) => {
	return new Promise((resolve, reject) => {
		mult.exec((err, replie) => {
			if (err) {
				reject(err);
			}

			resolve(replie);
		});
	});
};

redis.getJson = getJson;
redis.setJson = setJson;
redis.execAsync = execAsync;

(async () => {
	const testSet = await redis.set("hello", "hi");
	console.log("🚀 ~ testSet:", testSet);

	const testGet = await redis.get("hello");
	console.log("🚀 ~ testGet:", testGet);
})();

export default redis as CustomRedis;
