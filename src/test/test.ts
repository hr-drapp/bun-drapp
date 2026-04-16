import { connectDB } from "src/db/mongo";
import Admin from "src/models/clicknic/Admin";
import Game from "src/models/Game";
import GameTime from "src/models/GameTime";
import MessageQueue, { MessageQueueStatus } from "src/models/MessageQueue";
import Numbers from "src/models/Numbers";
import NumbersEntry from "src/models/NumbersEntry";
import Role from "src/models/clicknic/Role";
import SattaResult from "src/models/SattaResult";
import { AnkCategory } from "src/utils/anks";
import { testPersikopQueue } from "src/utils/bullmq";
import { sleep } from "src/utils/common";
import { Logger } from "src/utils/Logger";
import { MessageQueueWorker } from "src/utils/MessageQueueWorker";
import { MessageReactQueueWorker } from "src/utils/MessageReactQueueWorker";
import {
	generatePanaSPMotorNumbers,
	isCJCK,
	isCROSSING,
	isLadi,
	parseJodiBetText,
	parseMixBetText,
	parsePanaBetText,
} from "src/utils/numbers";
import Persikop from "src/utils/Periskop";

await connectDB("test");

const Peris = new Persikop();

// await GameTime.updateMany({ deleted: false });
// await Game.updateMany({ deleted: false });

// await Admin.updateMany({ deleted: false });

const response = await Peris.creategroup({
	name: "TEST",
	description: "",
	participants: ["917069305177", "919983396152"],
});
console.log("🚀 ~ response:", response);

// const messages = await MessageQueue.find({
// 	status: MessageQueueStatus.PENDING,//
// 	group: {
// 		$exists: true,
// 	},
// })
// 	.limit(1)
// 	.sort({
// 		createdAt: 1,
// 	});
// console.log("🚀 ~ messages:", messages);

console.log("FINISHED");
