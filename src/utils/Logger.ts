import moment, { Moment } from "moment";
import { WebhookLogger } from "./webhookLogger";

export class Logger {
	private logText: string;
	private timeStart: Moment;

	constructor() {
		this.timeStart = moment();
		this.logText = `===============================================================\n${this.timeStart.format(
			"h:mm:ss a, MMMM Do YYYY",
		)}`;
	}

	add(...text: any) {
		for (let t of text) {
			if (typeof t != "string") {
				t = JSON.stringify(t, null, 2);
			}
			this.logText = this.logText + `\n` + t;
		}
		return;
	}

	print() {
		this.add(
			`ended in ${moment().diff(
				this.timeStart,
				"milliseconds",
			)}ms\n===================================================================\n`,
		);
		// consola.box(this.logText);
		console.log(this.logText);
		WebhookLogger(this.logText + "\n");
	}
}
