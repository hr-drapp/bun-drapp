import { Queue, Worker } from "bullmq";
import Ioredis from "ioredis";
import Whapi from "./Whapi";
import Message from "src/models/Message";
import Persikop from "./Periskop";
import env from "src/config/redis";

const Peri = new Persikop();
const Wha = new Whapi();
// export function sleep(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

const connection = new Ioredis({
	username: env.username,
	password: env.password,
	host: env.host,
	port: env.port,
	maxRetriesPerRequest: null,
	enableReadyCheck: true,
});

// Quer Create
export const messageQueue = new Queue("whapi-message-queue", { connection });

export const testmessageQueue = new Queue("test-message-queue", { connection });

export const testPersikopQueue = new Queue("test-perikop-message-queue", {
	connection,
});

// Wroker create

export const messageWorker = new Worker(
	"whapi-message-queue",
	async (job, token) => {
		console.log("🚀 ~ job:", job.name);
		console.log("MESSAGE WORKER RUNNING");
		const payload = job.data;

		await Wha.sendMessage(payload);
	},
	{ connection, concurrency: 1 },
);

export const testmessageWorker = new Worker(
	"test-message-queue",
	async (job) => {
		console.log("TEST MESSAGE WORKER RUNNING");

		// await sleep(5000)
		await Wha.sendMessage(job.data);

		console.log(job.data);

		if (job.data.quote) {
			await Message.findOneAndUpdate(
				{ messageId: job.data.quote },
				{ status: "success" },
			);
		}
	},
	{ connection, concurrency: 1 },
);

export const testPeriskopmessageWorker = new Worker(
	"test-perikop-message-queue",
	async (job) => {
		console.log("TEST MESSAGE WORKER RUNNING");

		// await sleep(5000)
		await Peri.sendMessage(job.data);
		console.log(job.data);

		if (job.data.replyTo) {
			await Message.findOneAndUpdate(
				{ messageId: job.data.replyTo },
				{ status: "success" },
			);
		}
	},
	{ connection, concurrency: 1 },
);

messageWorker.on("failed", (job, err) => {
	console.log(`❌ Job ${job?.id} failed:`, err.message);
});
