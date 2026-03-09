import type { DocumentType } from "@typegoose/typegoose";
import moment from "moment";
import { Types } from "mongoose";
import { Logger } from "./Logger";
import AutoIncementalId, {
	AutoIncIdModel,
} from "src/models/drapp/AutoIncementalId";
import { t } from "elysia";

export function randomInRange(min: number, max: number) {
	return Math.floor(Math.random() * (max - min) + min);
}

export const convertMinutes = (minutes: number) => {
	if (minutes === null || minutes == 0 || isNaN(minutes)) return [0, 0];
	let h = Math.trunc(minutes / 60);
	let m = minutes % 60;

	let hDisplay = h;
	let mDisplay = m;

	return [hDisplay, mDisplay];
};

export const minuteToTimeRange = (m: number) => {
	const h = Math.floor(m / 60) % 12 || 12;
	const min = m % 60;
	const ap = m >= 720 ? "PM" : "AM";

	return `${h.toString().padStart(2, "0")}:${min
		.toString()
		.padStart(2, "0")} ${ap}`;
};

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export type SupportiveEmojiIndex = {
	regex: RegExp;
	map: Record<string, string>;
};

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildSupportiveEmojiIndex(
	entries: { text?: string; texts?: string }[],
): SupportiveEmojiIndex | null {
	const map: Record<string, string> = {};
	const words: string[] = [];

	for (const entry of entries) {
		const emoji = entry.text;
		const supportiveText = entry.texts;
		if (!emoji || !supportiveText) continue;

		for (const part of supportiveText.split(",")) {
			const word = part.trim().toLowerCase();
			if (!word || map[word]) continue;
			map[word] = emoji;
			words.push(word);
		}
	}

	if (words.length === 0) return null;
	words.sort((a, b) => b.length - a.length);
	const pattern = words.map(escapeRegExp).join("|");
	const regex = new RegExp(`(?<![A-Za-z])(?:${pattern})(?![A-Za-z])`, "gi");

	return { regex, map };
}

export function applySupportiveEmojiReplacements(
	input: string,
	index?: SupportiveEmojiIndex | null,
): string {
	if (!index) return input;
	return input.replace(
		index.regex,
		(match) => index.map[match.toLowerCase()] ?? match,
	);
}

/**
 * typescript function that inputs a text that contains emojis and amount for their respective emojis, sometimes the text contains random characters, sometimes single amount that applies to every emoji, sometimes different amount for each emoji, the emoji and amount can be seperated fro m any character, sometimes the there'll be no space between them as well, the text can contain anything, our code need to think very humanly to understand the text and find out the emoji and the amount. I'm giving you some expamples with their result too. so create a function that ouput like this json - { emojis: [], // array of emojis map:{ [emoji:string]: number }, // map of each emoji and their respective price total_amount: number // sum of the amount. }
 * Parse a messy text containing emojis + amounts (either per-emoji or one shared amount)
 * and return:
 * {
 *   emojis: string[],
 *   map: Record<string, number>,
 *   total_amount: number
 * }
 *
 * Works for cases like:
 * - 🐎100🐥150🙈250             (per-emoji amount right after each emoji)
 * - 🦧///🦒/🐫.into.700         (one amount applies to all emojis)
 * - 🐟(100)🐑(((700)))...       (amount wrapped in random brackets)
 * - 🫏Rs🐎rs... 700              (shared amount at the end)
 * - emojis separated by any junk characters, no spaces needed
 */

export default function parseEmojiAmounts(
	input: string,
	supportIndex?: SupportiveEmojiIndex | null,
) {
	// ----------------------------
	// 1) Extract emojis in order (Unicode-aware)
	// ----------------------------
	// This regex uses Unicode property escapes.
	// It matches "Extended_Pictographic" (most emojis), plus variation selectors / ZWJ combos.
	// NOTE: Requires runtime support for /u and \p{} (Node 16+ generally OK).
	const normalizedInput = applySupportiveEmojiReplacements(input, supportIndex);
	const emojiRe =
		/(\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*)/gu;

	// We'll store emoji occurrences with their position to inspect nearby numbers later
	const occurrences: { emoji: string; index: number; end: number }[] = [];

	let m: RegExpExecArray | null;
	while ((m = emojiRe.exec(normalizedInput)) !== null) {
		const emoji = m[1];
		const index = m.index;
		const end = index + emoji.length;

		occurrences.push({ emoji, index, end });
	}

	// If no emojis, nothing to do.
	if (occurrences.length === 0) {
		return {
			numbers: [],
			numbers_map: {},
			total_amount: 0,
			text: normalizedInput,
		};
	}

	// ----------------------------
	// 2) Helper: grab the closest "reasonable" number near a position
	// ----------------------------
	// We treat amounts like 50, 100, 700, 800, etc. (2-6 digits is safe)
	// and ignore times like "7:30" by rejecting numbers with ':' near them.
	const numberRe = /\d{1,6}/g;

	function isTimeLike(text: string, numStart: number, numEnd: number): boolean {
		// If immediately around the number there's a ':' like "7:30", treat as time.
		const left = text[numStart - 1] ?? "";
		const right = text[numEnd] ?? "";
		return left === ":" || right === ":";
	}

	function toIntSafe(s: string): number | null {
		const n = Number.parseInt(s, 10);
		return Number.isFinite(n) ? n : null;
	}

	// Find the first number in a substring, but ignore time-like numbers.
	function firstNumberIn(slice: string): number | null {
		numberRe.lastIndex = 0;
		let mm: RegExpExecArray | null;
		while ((mm = numberRe.exec(slice)) !== null) {
			const start = mm.index;
			const end = start + mm[0].length;

			// time-like check inside slice: if slice contains ":" adjacent to number
			if (isTimeLike(slice, start, end)) continue;

			const n = toIntSafe(mm[0]);
			if (n !== null) return n;
		}
		return null;
	}

	// Find the last number in a substring, but ignore time-like numbers.
	function lastNumberIn(slice: string): number | null {
		const matches: { s: string; start: number; end: number }[] = [];
		numberRe.lastIndex = 0;

		let mm: RegExpExecArray | null;
		while ((mm = numberRe.exec(slice)) !== null) {
			const start = mm.index;
			const end = start + mm[0].length;
			if (isTimeLike(slice, start, end)) continue;
			matches.push({ s: mm[0], start, end });
		}

		for (let i = matches.length - 1; i >= 0; i--) {
			const n = toIntSafe(matches[i].s);
			if (n !== null) return n;
		}
		return null;
	}

	// ----------------------------
	// 3) Tokenize numbers and assign them to the nearest preceding emoji group
	// ----------------------------
	const numberMatches: { value: number; index: number; end: number }[] = [];
	numberRe.lastIndex = 0;
	let nm: RegExpExecArray | null;
	while ((nm = numberRe.exec(normalizedInput)) !== null) {
		const start = nm.index;
		const end = start + nm[0].length;
		if (isTimeLike(normalizedInput, start, end)) continue;
		const n = toIntSafe(nm[0]);
		if (n !== null) numberMatches.push({ value: n, index: start, end });
	}

	const finalMap: Record<string, number> = {};
	const occurrenceAmounts: (number | null)[] = new Array(
		occurrences.length,
	).fill(null);
	const pending: number[] = [];
	let lastAssigned: number | null = null;

	let occIndex = 0;
	let numIndex = 0;
	while (occIndex < occurrences.length || numIndex < numberMatches.length) {
		const occ = occurrences[occIndex];
		const num = numberMatches[numIndex];

		if (occ && (!num || occ.index < num.index)) {
			pending.push(occIndex);
			occIndex++;
			continue;
		}

		if (num) {
			if (pending.length > 0) {
				for (const idx of pending) {
					occurrenceAmounts[idx] = num.value;
				}
				lastAssigned = num.value;
				pending.length = 0;
			}
			numIndex++;
		}
	}

	if (pending.length > 0 && lastAssigned !== null) {
		for (const idx of pending) {
			occurrenceAmounts[idx] = lastAssigned;
		}
	}

	// ----------------------------
	// 6) Prepare output arrays + total
	// ----------------------------
	const emojisInOrder = occurrences.map((o) => o.emoji);

	let total = 0;
	for (let i = 0; i < emojisInOrder.length; i++) {
		const amt = occurrenceAmounts[i];
		if (typeof amt === "number" && Number.isFinite(amt)) {
			total += amt;
			finalMap[emojisInOrder[i]] = (finalMap[emojisInOrder[i]] ?? 0) + amt;
		}
	}

	return {
		numbers: emojisInOrder,
		numbers_map: finalMap,
		total_amount: total,
		text: normalizedInput,
	};
}

export async function GetAutoIncrId(model: AutoIncIdModel, seq: number = 1) {
	return (
		await AutoIncementalId.findOneAndUpdate(
			{ id: model },
			{ $inc: { seq: seq } },
			{ new: true, upsert: true },
		)
	)?.seq;
}

export const MetaPaginationSchema = t.Object({
	pages: t.Number(),
	total: t.Number(),
	page: t.Number(),
	size: t.Number(),
});
