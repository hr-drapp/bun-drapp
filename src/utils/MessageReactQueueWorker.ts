import { connectDB } from "src/db/mongo";
import { sleep } from "./common";
import MessageReactQueue, {
	MessageReactQueueStatus,
} from "src/models/MessageReactQueue";
import Persikop from "./Periskop";

export class MessageReactQueueWorker {
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
			const reactions = await MessageReactQueue.find({
				status: MessageReactQueueStatus.PENDING,
			})
				.limit(1)
				.sort({
					createdAt: 1,
				});

			for (let reaction of reactions) {
				const request = await this.periskope?.addReaction({
					message_id: reaction.message_id!,
					reaction: reaction.reaction!,
				});
				console.log("🚀 ~ MessageReactQueueWorker ~ start ~ request:", request);
				reaction.status = MessageReactQueueStatus.COMPLETED;
				await reaction.save();
				console.log("WORKER COMPLETED JOB");
			}

			await sleep(100);
		}
	}

	public async stop() {
		this.running = false;
	}
}
