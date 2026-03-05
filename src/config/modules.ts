import { AbilitiMap, Ability } from "src/models/Role";

/**
 * Canonical list of module identifiers used for plant admin authorization.
 * Keep this in sync with the values returned from `/plant/modules`.
 */
export enum ModuleId {
	DASHBOARD = 1,
	ROLES_AND_PERMISSIONS = 2,
	GAME_CATEGORY = 3,
	GAME = 4,
	CHART = 5,
	GROUP = 6,
	NUMBER = 7,
	NOTICE = 8,
	SPINNER_HISAB_COMISSION = 9,
	SPINNER_RESULT = 10,
	SPINNER_HISAB_BOOK = 11,
	SPINNER_HOME_SITE = 12,
	SPINNER_MARKET = 13,
	WALLET = 14,
}

export const FULL_ACCESS_ABILITIES: Ability = [
	AbilitiMap.READ,
	AbilitiMap.CREATE,
	AbilitiMap.UPDATE,
	AbilitiMap.DELETE,
];

export const Summary = (modules: ModuleId[]) => {
	return JSON.stringify({ modules: modules });
};

const gen = (_id: number, name: string) => ({ _id, name });

export const BasicModuleList = [
	gen(ModuleId.DASHBOARD, "Dashboard"),
	gen(ModuleId.ROLES_AND_PERMISSIONS, "Roles & Permissions"),
];
export const AdditionalModuleList = [
	gen(ModuleId.GAME, "Game"),
	gen(ModuleId.GAME_CATEGORY, "Game Category"),
	gen(ModuleId.CHART, "Chart"),
	gen(ModuleId.GROUP, "Group"),
	gen(ModuleId.NOTICE, "Notice"),
	gen(ModuleId.SPINNER_HISAB_COMISSION, "Hisab Comission"),
	gen(ModuleId.SPINNER_RESULT, "Khabar"),
	gen(ModuleId.SPINNER_HISAB_BOOK, "Hisab Book"),
	gen(ModuleId.SPINNER_HOME_SITE, "Home Site"),
	gen(ModuleId.SPINNER_MARKET, "11 Market"),
	gen(ModuleId.WALLET, "Wallet"),
];
export const ModuleList = [...BasicModuleList, ...AdditionalModuleList];
