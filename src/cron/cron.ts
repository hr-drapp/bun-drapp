import Agenda, { Job } from "agenda";
import moment from "moment";
import env from "src/config/mongo";
import { connectDB } from "src/db/mongo";
import SattaEntry from "src/models/SattaEntry";
import SattaNumberEntry from "src/models/SattaNumberEntry";
import fs from "fs";
import path from "path";
import Result from "src/models/Result";
import GroupGameTime from "src/models/GroupGameTime";
import Group from "src/models/Group";
import MessageQueue from "src/models/MessageQueue";
import GameTime from "src/models/GameTime";
import { minuteToTimeRange, runAutoResult } from "src/utils/common";

const filePath = path.join("./temp/webhook.log");

if (!fs.existsSync(path.dirname(filePath))) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

const agenda = new Agenda({
	db: {
		address: env.uri,
		collection: "agenda_jobs",
	},
});

// agenda.define("test-job", async (job: Job) => {
// 	console.log(job?.attrs);
// });

await connectDB("Cron");

agenda.define("delete-10-days-old-data", async (job: Job) => {
	console.log("Job delete-10-days-old-data");
	const tenDaysAgo = moment().subtract(10, "days").toDate();
	(async () => {
		const sattaEntry = await SattaEntry.deleteMany({
			createdAt: {
				$lt: tenDaysAgo,
			},
		});

		console.log(`SattaEntry Deleted: `, sattaEntry.deletedCount);

		const sattaNumberEntry = await SattaNumberEntry.deleteMany({
			createdAt: {
				$lt: tenDaysAgo,
			},
		});

		console.log(`SattaNumberEntry Deleted: `, sattaNumberEntry.deletedCount);
	})();

	await agenda.schedule(
		moment().add(24, "hours").format(),
		"delete-10-days-old-data",
		{},
	);
});

agenda.define("delete-log-file-data", async (job: Job) => {
	fs.writeFileSync(filePath, "");
	console.log(`[${new Date().toLocaleString()}] webhook.log cleared`);
});

agenda.define("send-result-message", async (job: Job) => {
	const { result_id } = job.attrs.data as { result_id: string };

	console.log("📢 Running send-result-message", result_id);

	const result = await Result.findById(result_id).populate([
		{
			path: "game_time",
			select: "end",
			populate: { path: "game", select: "name" },
		},
		{
			path: "number",
			select: "text",
		},
	]);

	console.log("Result", result);

	if (!result) return;

	const groupGameTime = await GroupGameTime.find({
		game_time: result?.game_time._id,
	});

	if (!groupGameTime?.length) return;

	const groups = await Group.find({
		_id: { $in: groupGameTime.map((g) => g.group) },
	});
	//   console.log("Groups", groups);

	const now = moment(result.date);

	for (let group of groups) {
		await MessageQueue.create({
			group: group.groupId,
			text: `🏆_*${now.format("DD/MM/YYYY")}*_🏆

_*${(result?.game_time as any)?.game?.name} ${minuteToTimeRange(
				(result?.game_time as any)?.end,
			)}*_
---------------------------
_*WIN ${(result.number as any).text}CONGRATS.*_
---------------------------
_*11chakri.com*_
`,
		});
	}
});

// agenda.define("auto-result", async (job: Job) => {
//   const now = moment();
//   const nowMinutes = now.diff(moment().startOf("day"), "minutes");
//   const todayStart = moment().startOf("day").toDate();

//   const gameTimes = await GameTime.find({
//     auto_result: true,
//     end: { $lte: nowMinutes },

//     result_status: false,
//     result_processing: false,

//     $or: [
//       { result_updated_at: { $lt: todayStart } },
//       { result_updated_at: { $exists: false } },
//     ],
//   }).lean();

//   if (!gameTimes.length) return;

//   for (const gameTime of gameTimes) {
//     const locked = await GameTime.findOneAndUpdate(
//       {
//         _id: gameTime._id,
//         result_processing: false,
//       },
//       {
//         $set: {
//           result_processing: true,
//         },
//       },
//       { new: true }
//     );

//     if (!locked) continue;

//     try {
//       const result = await runAutoResult(locked._id.toString());

//       if (result) {
//         await agenda.now("send-result-message", {
//           result_id: result._id.toString(),
//         });

//         await GameTime.findByIdAndUpdate(locked._id, {
//           $set: {
//             result_status: true,
//             result_processing: false,
//             result_updated_at: new Date(),
//           },
//         });
//       } else {
//         await GameTime.findByIdAndUpdate(locked._id, {
//           $set: { result_processing: false },
//         });
//       }
//     } catch (err) {
//       console.error("❌ Auto Result Error:", err);

//       await GameTime.findByIdAndUpdate(locked._id, {
//         $set: { result_processing: false },
//       });
//     }
//   }
// });

(async () => {
	console.log("Starting Agenda");
	await agenda.start();
	console.log(`Agenda Started: ${moment().add(24, "hours").format()}`);
	await agenda.schedule(
		moment().add(24, "hours").format(),
		"delete-10-days-old-data",
		{},
	);

	await agenda.every(
		"0 0 * * *",
		"delete-log-file-data",
		{},
		{ timezone: "Asia/Kolkata" },
	);

	console.log("Agenda Job Started");
})();

export default agenda;
