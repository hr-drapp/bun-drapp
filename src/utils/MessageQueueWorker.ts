import { connectDB } from "src/db/mongo";
import { sleep } from "./common";
import Persikop from "./Periskop";
import MessageQueue, { MessageQueueStatus } from "src/models/MessageQueue";
import MessageReactQueue, {
	MessageReactQueueStatus,
} from "src/models/MessageReactQueue";
import { Logger } from "./Logger";

export class MessageQueueWorker {
	private running = false;
	private periskope?: Persikop;

	constructor() {
		this.init();
	}

	private async init() {
		// await connectDB("message-queue");
		this.periskope = new Persikop();
	}

	public async start() {
		this.running = true;

		while (this.running) {
			const logger = new Logger();
			const messages = await MessageQueue.find({
				status: MessageQueueStatus.PENDING,
				group: {
					$exists: true,
				},
			})
				.limit(1)
				.sort({
					createdAt: 1,
				});

			logger.add(`messages.length: ${messages.length}`);

			for (let message of messages) {
				logger.add(`message.text: ${message.text}`);
				logger.add(`message.reaction: ${message.reaction}`);
				logger.add(`message.group: ${message.group}`);
				logger.add(`message.quotedId: ${message.quotedId}`);
				logger.add(`message.status: ${message.status}`);

				const request = await this.periskope?.sendMessage({
					group: message.group!,
					message: message.text! || "NA",
					replyTo: message.quotedId,
				});
				console.log("🚀 ~ MessageQueueWorker ~ start ~ request:", request);
				logger.add(`request.error: ${JSON.stringify(request?.error)}`);
				logger.add(`request.status: ${request?.status}`);
				logger.add(`request.statusCode: ${request?.statusCode}`);
				logger.add(`request.data: ${JSON.stringify(request?.data)}`);
				if (
					request?.error === null &&
					request.status === 200 &&
					request.statusCode === "OK"
				) {
					message.status = MessageQueueStatus.COMPLETED;
					await message.save();
					await MessageReactQueue.create({
						message_id: message.quotedId,
						reaction: message.reaction || "✅",
						status: MessageReactQueueStatus.PENDING,
					});
					console.log("WORKER COMPLETED JOB");
					logger.add(`WORKER COMPLETED JOB`);
				} else {
					logger.add(`WORKER FAILED JOB`);
					console.log("WORKER FAILED JOB");
				}
			}

			if (messages.length) {
				logger.print();
			}

			await sleep(100);
		}
	}

	public async stop() {
		this.running = false;
	}
}
