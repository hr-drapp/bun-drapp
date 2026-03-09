import { connectDB } from "src/db/mongo";
import { runAutoResult, sleep } from "./common";
import Persikop from "./Periskop";
import MessageQueue, { MessageQueueStatus } from "src/models/MessageQueue";
import MessageReactQueue, {
	MessageReactQueueStatus,
} from "src/models/MessageReactQueue";
import { Logger } from "./Logger";
import GameTime, { GameTimeStatus } from "src/models/GameTime";
import moment from "moment";
import Result from "src/models/Result";

export class ResultQueueWorker {
	private running = false;

	constructor() {
		this.init();
	}

	private async init() {
		// await connectDB("message-queue");
	}

	public async start() {
		this.running = true;

		while (this.running) {
			const logger = new Logger();
			logger.add("hey");

			const now = moment();
			const nowMinutes = now.diff(moment().startOf("day"), "minutes");
			const todayStart = moment().startOf("day").toDate();

			const gameTimes = await GameTime.find({
				status: GameTimeStatus.RESULT_PENDING,
				end: { $lte: nowMinutes },
				auto_result: true,
				$or: [
					{ result_updated_at: { $lt: todayStart } },
					{ result_updated_at: { $exists: false } },
				],
			})
				.limit(1)
				.sort({
					createdAt: 1,
				});

			logger.add(`Found: ${gameTimes.length} | ${nowMinutes}m`);

			for (let message of gameTimes) {
				message.status = GameTimeStatus.RESULT_IN_PROGRESS;
				await message.save();
				const predection = await runAutoResult(message._id, logger);
				logger.add(
					`${predection.status} | ${predection.message} | ${
						predection?.data || ""
					}`,
				);
				if (!predection?.status) {
					continue;
				}
				const result = await Result.create({
					date: moment().toDate(),
					end: message.end,
					game_time: message._id,
					number: predection.data?.number,
				});
			}
			if (gameTimes.length) {
				logger.print();
			}
			await sleep(1000);
		}
	}

	public async stop() {
		this.running = false;
	}
}
