import { PeriskopeApi } from "@periskope/periskope-client";
import { customError } from "./AppErr";
export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
export default class Persikop {
	private token = process.env.PERISKOPE_API_KEY!;
	private phone = "917069305177";

	private client: PeriskopeApi;

	constructor() {
		this.client = new PeriskopeApi({
			authToken: this.token,
			phone: this.phone,
		});
	}

	public async sendMessage(option: {
		group: string;
		message: string;
		replyTo?: string;
	}) {
		const { group, message, replyTo } = option;
		try {
			console.log("⌨️ Typing...");
			// await sleep(2000);
			const res = await this.client.message.send({
				chat_id: group,
				message: message,
				reply_to: replyTo,
			});

			// console.log("🚀 ~ Peroskop Mesage Sent", res.data);
			console.log("🚀 ~ Peroskop Mesage Status", res.statusCode);
			return res;
		} catch (error: any) {
			console.error("🚀  Periskop Message Sent Error", error?.message);
			return null;
		}
	}

	public async addReaction(option: { message_id: string; reaction: string }) {
		const { message_id, reaction } = option;
		try {
			const res = await this.client.message.react({
				message_id: message_id,
				reaction: reaction,
			});

			// console.log("🚀 ~ Peroskop Mesage Sent", res.data);
			console.log("🚀 ~ Peroskop Mesage Status", res.statusCode);
			return res;
		} catch (error: any) {
			console.error("🚀  Periskop Message Sent Error", error?.message);
			return null;
		}
	}

	public async creategroup(option: {
		name: string;
		participants: any;
		description: string;
	}) {
		try {
			const { name, description, participants } = option;

			const res = await this.client.group.create({
				group_name: name,
				participants: participants,
				options: {
					description: description,
				},
			});

			// console.log("🚀 ~ Periskop Group Create Response", res.data);
			console.log("🚀 ~ Periskop creategroup", res);

			return res?.data;
		} catch (error: any) {
			console.error("🚀 ~ Periskop creategroup Error", error.message);
			return customError("cant create group at the moment");
		}
	}
	public async addParticipantsToGroup(option: {
		groupChatId: string;
		participants: string[];
	}) {
		try {
			const { groupChatId, participants } = option;

			const res = await this.client.group.addParticipant({
				chat_id: groupChatId,
				participants: participants,
				force_add_participants: true,
			});

			// console.log("🚀 ~ Periskop Group Create Response", res.data);
			console.log("🚀 ~ Periskop addParticipantsToGroup", res);

			return res?.data;
		} catch (error: any) {
			console.error(
				"🚀 ~ Periskop addParticipantsToGroup Error",
				error.message,
			);
		}
	}

	public async removeParticipantsToGroup(option: {
		groupChatId: string;
		participants: string[];
	}) {
		try {
			const { groupChatId, participants } = option;

			const res = await this.client.group.removeParticipant({
				chat_id: groupChatId,
				participants: participants,
			});

			// console.log("🚀 ~ Periskop Group Create Response", res.data);
			console.log("🚀 ~ Periskop removeParticipantsToGroup", res);

			return res?.data;
		} catch (error: any) {
			console.error(
				"🚀 ~ Periskop removeParticipantsToGroup Error",
				error.message,
			);
		}
	}

	public async updateGroupName(option: { groupChatId: string; name: string }) {
		try {
			const { groupChatId, name } = option;

			const res = await this.client.group.updateSettings({
				chat_id: groupChatId,
				name: name,
			});

			// console.log("🚀 ~ Periskop Group Create Response", res.data);
			console.log("🚀 ~ Periskop Mesage Status", res.statusCode);

			return res?.data;
		} catch (error: any) {
			console.error("🚀 ~ Periskop Message Send Error", error.message);
		}
	}

	public async addInContacts(option: { name: string; number?: string }) {
		try {
			const { name, number } = option;
			const res = await this.client.contact.create({
				contact_name: name,
				contact_id: "91" + number,
			});
			// console.log("🚀 ~ Peroskop Contacts Create ", res.data);
			console.log("🚀 ~ Peroskop Mesage Status", res.statusCode);
		} catch (error: any) {
			console.error("🚀  Periskop Message Sent Error", error?.message);
		}
	}
}
