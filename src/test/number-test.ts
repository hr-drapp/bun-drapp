import {
	applySupportiveEmojiReplacements,
	buildSupportiveEmojiIndex,
	type SupportiveEmojiIndex,
} from "src/utils/common";

type ParseResult = {
	emojis: string[];
	map: Record<string, number>;
	total_amount: number;
	text: string;
};

type Example = {
	text: string;
	emojis: string[];
	map: Record<string, number>;
	total_amount: number;
};

type Fault = {
	index: number;
	text: string;
	expected: Example;
	actual: ParseResult;
	issues: string[];
};

const supportIndexExample = buildSupportiveEmojiIndex([
	{ text: "🦁", texts: "lion,sher" },
	{ text: "🐯", texts: "tiger,bagh" },
	{ text: "🪔", texts: "dipak,diya" },
]);

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

function parseEmojiAmounts(
	input: string,
	supportIndex?: SupportiveEmojiIndex | null,
): ParseResult {
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
			emojis: [],
			map: {},
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
		emojis: emojisInOrder,
		map: finalMap,
		total_amount: total,
		text: normalizedInput,
	};
}

const examples: Example[] = [
	{
		text: "Sonu\n🐟(100)🐑(((700)))🦚(270)🦢(150)🐓(40)🦃((900))\nMyroj 8baje",
		emojis: ["🐟", "🐑", "🦚", "🦢", "🐓", "🦃"],
		map: { "🐟": 100, "🐑": 700, "🦚": 270, "🦢": 150, "🐓": 40, "🦃": 900 },
		total_amount: 2160,
	},
	{
		text: "🐎100🐥150🙈250",
		emojis: ["🐎", "🐥", "🙈"],
		map: { "🐎": 100, "🐥": 150, "🙈": 250 },
		total_amount: 500,
	},
	{
		text: "🐈((790))🦨((500))\nNathu",
		emojis: ["🐈", "🦨"],
		map: { "🐈": 790, "🦨": 500 },
		total_amount: 1290,
	},
	{
		text: "🦧///🦒/🐫.into.700",
		emojis: ["🦧", "🦒", "🐫"],
		map: { "🦧": 700, "🦒": 700, "🐫": 700 },
		total_amount: 2100,
	},
	{
		text: "🦋.....🐖....🐄..🐘=350",
		emojis: ["🦋", "🐖", "🐄", "🐘"],
		map: { "🦋": 350, "🐖": 350, "🐄": 350, "🐘": 350 },
		total_amount: 1400,
	},
	{
		text: "Shanu\nRaj\n🫏Rs🐎rs🐘rs🐅rs.🦫.rs🐲rs 700\n7:30baje",
		emojis: ["🫏", "🐎", "🐘", "🐅", "🦫", "🐲"],
		map: { "🫏": 700, "🐎": 700, "🐘": 700, "🐅": 700, "🦫": 700, "🐲": 700 },
		total_amount: 4200,
	},
	{
		text: "🐪,🐏,,🐂,🦏,,,,🐫Rs800",
		emojis: ["🐪", "🐏", "🐂", "🦏", "🐫"],
		map: { "🐪": 800, "🐏": 800, "🐂": 800, "🦏": 800, "🐫": 800 },
		total_amount: 4000,
	},
	{
		text: "🐕‍🦺into🐐.into🦩intu🦥..into.500\nRam shyam",
		emojis: ["🐕‍🦺", "🐐", "🦩", "🦥"],
		map: { "🐕‍🦺": 500, "🐐": 500, "🦩": 500, "🦥": 500 },
		total_amount: 2000,
	},
	{
		text: "🦩--🦧-🐑---🦢++🦚rs 150\nNath",
		emojis: ["🦩", "🦧", "🐑", "🦢", "🦚"],
		map: { "🦩": 150, "🦧": 150, "🐑": 150, "🦢": 150, "🦚": 150 },
		total_amount: 750,
	},
	{
		text: "🐒@🦚@🐑@🐘@🐥@500",
		emojis: ["🐒", "🦚", "🐑", "🐘", "🐥"],
		map: { "🐒": 500, "🦚": 500, "🐑": 500, "🐘": 500, "🐥": 500 },
		total_amount: 2500,
	},
	{
		text: "🦋#🐏#🦢=250",
		emojis: ["🦋", "🐏", "🦢"],
		map: { "🦋": 250, "🐏": 250, "🦢": 250 },
		total_amount: 750,
	},
	{
		text: "🐎 🐖  🦏===360\nYuvi",
		emojis: ["🐎", "🐖", "🦏"],
		map: { "🐎": 360, "🐖": 360, "🦏": 360 },
		total_amount: 1080,
	},
	{
		text: "Morning \n🦃//🦫/🦨//🐟/🦜fd700\n\nSantosh",
		emojis: ["🦃", "🦫", "🦨", "🐟", "🦜"],
		map: { "🦃": 700, "🦫": 700, "🦨": 700, "🐟": 700, "🦜": 700 },
		total_amount: 3500,
	},
	{
		text: "🐔&&🦅@@@🦉.into.250",
		emojis: ["🐔", "🦅", "🦉"],
		map: { "🐔": 250, "🦅": 250, "🦉": 250 },
		total_amount: 750,
	},
	{
		text: "🐒**🐥//🐣???🙈----550\nAshok",
		emojis: ["🐒", "🐥", "🐣", "🙈"],
		map: { "🐒": 550, "🐥": 550, "🐣": 550, "🙈": 550 },
		total_amount: 2200,
	},
	{
		text: "🦑🕷️+🐞==🐌%%🦋==🐺====350\nSohan",
		emojis: ["🦑", "🕷️", "🐞", "🐌", "🦋", "🐺"],
		map: { "🦑": 350, "🕷️": 350, "🐞": 350, "🐌": 350, "🦋": 350, "🐺": 350 },
		total_amount: 2100,
	},
	{
		text: "🫏-🦚-🐄-50",
		emojis: ["🫏", "🦚", "🐄"],
		map: { "🫏": 50, "🦚": 50, "🐄": 50 },
		total_amount: 150,
	},
	{
		text: "🐫(🦜(🦉(600",
		emojis: ["🐫", "🦜", "🦉"],
		map: { "🐫": 600, "🦜": 600, "🦉": 600 },
		total_amount: 1800,
	},
	{
		text: "🦢(🐘(🐑(🐂(150)",
		emojis: ["🦢", "🐘", "🐑", "🐂"],
		map: { "🦢": 150, "🐘": 150, "🐑": 150, "🐂": 150 },
		total_amount: 600,
	},
	{
		text: "🦬:🐄:🦋=300",
		emojis: ["🦬", "🐄", "🦋"],
		map: { "🦬": 300, "🐄": 300, "🦋": 300 },
		total_amount: 900,
	},
	{
		text: "🦚+🐪+🐺+🐎+🦥+90",
		emojis: ["🦚", "🐪", "🐺", "🐎", "🦥"],
		map: { "🦚": 90, "🐪": 90, "🐺": 90, "🐎": 90, "🦥": 90 },
		total_amount: 450,
	},
	{
		text: "🦚+🐪+🐺+🐎+🦥=90",
		emojis: ["🦚", "🐪", "🐺", "🐎", "🦥"],
		map: { "🦚": 90, "🐪": 90, "🐺": 90, "🐎": 90, "🦥": 90 },
		total_amount: 450,
	},
	{
		text: "🫏*🦏*🦉*🐫*🐄*🐑*500",
		emojis: ["🫏", "🦏", "🦉", "🐫", "🐄", "🐑"],
		map: { "🫏": 500, "🦏": 500, "🦉": 500, "🐫": 500, "🐄": 500, "🐑": 500 },
		total_amount: 3000,
	},
	{
		text: "🐖₹🐺₹🐪₹🐏₹170",
		emojis: ["🐖", "🐺", "🐪", "🐏"],
		map: { "🐖": 170, "🐺": 170, "🐪": 170, "🐏": 170 },
		total_amount: 680,
	},
	{
		text: "🐖₹🐺₹🐪₹🐏=170",
		emojis: ["🐖", "🐺", "🐪", "🐏"],
		map: { "🐖": 170, "🐺": 170, "🐪": 170, "🐏": 170 },
		total_amount: 680,
	},
	{
		text: "🦢&🦜&🐥&400",
		emojis: ["🦢", "🦜", "🐥"],
		map: { "🦢": 400, "🦜": 400, "🐥": 400 },
		total_amount: 1200,
	},
	{
		text: "🦢&🦜&🐥=400",
		emojis: ["🦢", "🦜", "🐥"],
		map: { "🦢": 400, "🦜": 400, "🐥": 400 },
		total_amount: 1200,
	},
	{
		text: "🐌ggg🐞t🐜hh100\n🦂jjj🐢ii🦐aaa🪼mrhh🦑rs 160\nAnkit",
		emojis: ["🐌", "🐞", "🐜", "🦂", "🐢", "🦐", "🪼", "🦑"],
		map: {
			"🐌": 100,
			"🐞": 100,
			"🐜": 100,
			"🦂": 160,
			"🐢": 160,
			"🦐": 160,
			"🪼": 160,
			"🦑": 160,
		},
		total_amount: 1100,
	},
	{
		text: "🦏🐄rs..🐂ts🐎rs🐏into.250\nNanu",
		emojis: ["🦏", "🐄", "🐂", "🐎", "🐏"],
		map: { "🦏": 250, "🐄": 250, "🐂": 250, "🐎": 250, "🐏": 250 },
		total_amount: 1250,
	},
	{
		text: "🦢.🐪.🐺.🐏.🐄intu300",
		emojis: ["🦢", "🐪", "🐺", "🐏", "🐄"],
		map: { "🦢": 300, "🐪": 300, "🐺": 300, "🐏": 300, "🐄": 300 },
		total_amount: 1500,
	},
	{
		text: "🐏🐄🐺rs600",
		emojis: ["🐏", "🐄", "🐺"],
		map: { "🐏": 600, "🐄": 600, "🐺": 600 },
		total_amount: 1800,
	},
	{
		text: "🐖?🐏?🦉?🐺?500",
		emojis: ["🐖", "🐏", "🦉", "🐺"],
		map: { "🐖": 500, "🐏": 500, "🦉": 500, "🐺": 500 },
		total_amount: 2000,
	},
	{
		text: "🐖?🐏?🦉?🐺=500",
		emojis: ["🐖", "🐏", "🦉", "🐺"],
		map: { "🐖": 500, "🐏": 500, "🦉": 500, "🐺": 500 },
		total_amount: 2000,
	},
	{
		text: "🐖?🐏?🦉?🐺-500",
		emojis: ["🐖", "🐏", "🦉", "🐺"],
		map: { "🐖": 500, "🐏": 500, "🦉": 500, "🐺": 500 },
		total_amount: 2000,
	},
	{
		text: "🐫/🐑/🐏/🐺/🦥/🦚/140",
		emojis: ["🐫", "🐑", "🐏", "🐺", "🦥", "🦚"],
		map: { "🐫": 140, "🐑": 140, "🐏": 140, "🐺": 140, "🦥": 140, "🦚": 140 },
		total_amount: 840,
	},
	{
		text: "🐫/🐑/🐏/🐺/🦥/🦚-140",
		emojis: ["🐫", "🐑", "🐏", "🐺", "🦥", "🦚"],
		map: { "🐫": 140, "🐑": 140, "🐏": 140, "🐺": 140, "🦥": 140, "🦚": 140 },
		total_amount: 840,
	},
	{
		text: "🐫/🐑/🐏/🐺/🦥/🦚Rs140",
		emojis: ["🐫", "🐑", "🐏", "🐺", "🦥", "🦚"],
		map: { "🐫": 140, "🐑": 140, "🐏": 140, "🐺": 140, "🦥": 140, "🦚": 140 },
		total_amount: 840,
	},
	{
		text: "🐫/🐑/🐏/🐺/🦥/🦚=140",
		emojis: ["🐫", "🐑", "🐏", "🐺", "🦥", "🦚"],
		map: { "🐫": 140, "🐑": 140, "🐏": 140, "🐺": 140, "🦥": 140, "🦚": 140 },
		total_amount: 840,
	},
	{
		text: "🐫/🐑/🐏/🐺/🦥/🦚into140",
		emojis: ["🐫", "🐑", "🐏", "🐺", "🦥", "🦚"],
		map: { "🐫": 140, "🐑": 140, "🐏": 140, "🐺": 140, "🦥": 140, "🦚": 140 },
		total_amount: 840,
	},
	{
		text: "🐏%🐪%🦢%🐎%60",
		emojis: ["🐏", "🐪", "🦢", "🐎"],
		map: { "🐏": 60, "🐪": 60, "🦢": 60, "🐎": 60 },
		total_amount: 240,
	},
	{
		text: "🐏%🐪%🦢%🐎=60",
		emojis: ["🐏", "🐪", "🦢", "🐎"],
		map: { "🐏": 60, "🐪": 60, "🦢": 60, "🐎": 60 },
		total_amount: 240,
	},
	{
		text: "🐏%🐪%🦢%🐎-60",
		emojis: ["🐏", "🐪", "🦢", "🐎"],
		map: { "🐏": 60, "🐪": 60, "🦢": 60, "🐎": 60 },
		total_amount: 240,
	},
	{
		text: "🐏%🐪%🦢%🐎into60",
		emojis: ["🐏", "🐪", "🦢", "🐎"],
		map: { "🐏": 60, "🐪": 60, "🦢": 60, "🐎": 60 },
		total_amount: 240,
	},
	{
		text: "🐏%🐪%🦢%🐎rs60",
		emojis: ["🐏", "🐪", "🦢", "🐎"],
		map: { "🐏": 60, "🐪": 60, "🦢": 60, "🐎": 60 },
		total_amount: 240,
	},
	{
		text: "🐎,🐖,🦬,🐄,🦜,🦥,230",
		emojis: ["🐎", "🐖", "🦬", "🐄", "🦜", "🦥"],
		map: { "🐎": 230, "🐖": 230, "🦬": 230, "🐄": 230, "🦜": 230, "🦥": 230 },
		total_amount: 1380,
	},
	{
		text: "🐎,🐖,🦬,🐄,🦜,🦥=230",
		emojis: ["🐎", "🐖", "🦬", "🐄", "🦜", "🦥"],
		map: { "🐎": 230, "🐖": 230, "🦬": 230, "🐄": 230, "🦜": 230, "🦥": 230 },
		total_amount: 1380,
	},
	{
		text: "🐎,🐖,🦬,🐄,🦜,🦥-230",
		emojis: ["🐎", "🐖", "🦬", "🐄", "🦜", "🦥"],
		map: { "🐎": 230, "🐖": 230, "🦬": 230, "🐄": 230, "🦜": 230, "🦥": 230 },
		total_amount: 1380,
	},
	{
		text: "🦥=🐎=🐪=🦚=🦚=400",
		emojis: ["🦥", "🐎", "🐪", "🦚", "🦚"],
		map: { "🦥": 400, "🐎": 400, "🐪": 400, "🦚": 800 },
		total_amount: 2000,
	},
	{
		text: "🦥=🐎=🐪=🦚=🦚-400",
		emojis: ["🦥", "🐎", "🐪", "🦚", "🦚"],
		map: { "🦥": 400, "🐎": 400, "🐪": 400, "🦚": 800 },
		total_amount: 2000,
	},
	{
		text: "Dipak-500",
		emojis: ["🪔"],
		map: { "🪔": 500 },
		total_amount: 500,
	},
	{
		text: "lion=100 tiger(50)",
		emojis: ["🦁", "🐯"],
		map: { "🦁": 100, "🐯": 50 },
		total_amount: 150,
	},
	{
		text: "⚽🦋🪔⚽=300",
		emojis: ["⚽", "🦋", "🪔", "⚽"],
		map: { "⚽": 600, "🦋": 300, "🪔": 300 },
		total_amount: 1200,
	},
];

function compareExamples(input: Example[]): {
	successRate: number;
	faults: Fault[];
} {
	const faults: Fault[] = [];
	let passCount = 0;

	for (let i = 0; i < input.length; i++) {
		const example = input[i];
		const actual = parseEmojiAmounts(example.text, supportIndexExample);
		console.log("🚀 ~ compareExamples ~ actual:", actual);
		const issues: string[] = [];

		if (!arraysEqual(example.emojis, actual.emojis)) {
			issues.push("emojis mismatch");
		}
		if (!mapsEqual(example.map, actual.map)) {
			issues.push("map mismatch");
		}
		if (example.total_amount !== actual.total_amount) {
			issues.push("total_amount mismatch");
		}

		if (issues.length === 0) {
			passCount++;
		} else {
			faults.push({
				index: i,
				text: example.text,
				expected: example,
				actual,
				issues,
			});
		}
	}

	return {
		successRate: input.length === 0 ? 1 : passCount / input.length,
		faults,
	};
}

function arraysEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

function mapsEqual(
	a: Record<string, number>,
	b: Record<string, number>,
): boolean {
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	for (const k of aKeys) {
		if (a[k] !== b[k]) return false;
	}
	return true;
}

function formatFaults(faults: Fault[]): string[] {
	const lines: string[] = [];
	for (const fault of faults) {
		lines.push(`Case ${fault.index + 1}: ${fault.issues.join(", ")}`);
		lines.push(`text: ${fault.text}`);
		lines.push(`expected.emojis: ${JSON.stringify(fault.expected.emojis)}`);
		lines.push(`actual.emojis:   ${JSON.stringify(fault.actual.emojis)}`);
		lines.push(`expected.map:   ${JSON.stringify(fault.expected.map)}`);
		lines.push(`actual.map:     ${JSON.stringify(fault.actual.map)}`);
		lines.push(`expected.total: ${fault.expected.total_amount}`);
		lines.push(`actual.total:   ${fault.actual.total_amount}`);
		lines.push("---");
	}
	return lines;
}

const report = compareExamples(examples);
const successPercent = Math.round(report.successRate * 10000) / 100;
console.log(
	`Success rate: ${successPercent}% (${
		examples.length - report.faults.length
	}/${examples.length})`,
);
if (report.faults.length > 0) {
	console.log("Faults:");
	console.log(formatFaults(report.faults).join("\n"));
}
