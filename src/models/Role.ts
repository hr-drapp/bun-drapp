import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import * as mongoose from "mongoose";

export enum RoleLevel {
	L1 = 1,
	L2 = 2,
	L3 = 3,
}
@modelOptions({ schemaOptions: { collection: "roles" } })
export class RoleClass {
	@prop({})
	public name!: string;

	@prop()
	public permissions!: Permission;

	@prop({ default: 0 })
	public order!: number;

	@prop({ default: false })
	public super_admin!: boolean;

	@prop({ default: 0 })
	public total_admins!: number;

	@prop({ default: RoleLevel.L3, min: RoleLevel.L1 })
	public level!: number;
}

export type Abilities = 1 | 2 | 3 | 4;

export type Ability = Abilities[];

export interface Permission {
	[module: number]: {
		ability: Ability;
	};
}

export enum AbilitiMap {
	READ = 1,
	CREATE = 2,
	UPDATE = 3,
	DELETE = 4,
}

export const abilityHttpMap = {
	GET: AbilitiMap.READ,
	POST: AbilitiMap.CREATE,
	PUT: AbilitiMap.UPDATE,
	DELETE: AbilitiMap.DELETE,
};

export default getModelForClass(RoleClass);
