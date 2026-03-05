import { t } from "elysia";

const name = "Setting";

export const SettingSchema = t.Object({
	contact_number: t.Object({
		_id: t.String(),
		name: t.Optional(t.String()),
		key: t.String(),
		value: t.Any(),
	})
}, {
	title: "settingDetailResponse"
});

const MetaPaginationSchema = t.Object({
	pages: t.Number(),
	total: t.Number(),
	page: t.Number(),
	size: t.Number(),
});

export default {
	list: {
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: SettingSchema,
					meta: MetaPaginationSchema,
				},
				{
					description: `${name} list response`,
				},
			),
		},
		detail: {
			operationId: "list",
		},
	},
	create: {
		body: t.Object({
			name: t.String(),
			key: t.String(),
			value: t.Any(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: SettingSchema,
				},
				{
					description: `${name} create response`,
				},
			),
		},
		detail: {
			operationId: "create",
		},
	},
	update: {
		body: t.Optional(
			t.Object({
				name: t.String(),
				key: t.String(),
				value: t.String(),
			}),
		),
		query: t.Object({
			id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: SettingSchema,
				},
				{
					description: `${name} update response`,
				},
			),
		},
		detail: {
			operationId: "update",
		},
	},
	delete: {
		query: t.Object({
			id: t.String(),
		}),
		response: {
			200: t.Object(
				{
					status: t.Boolean(),
					message: t.String(),
					data: SettingSchema,
				},
				{
					description: `${name} delete response`,
				},
			),
		},
		detail: {
			operationId: "delete",
		},
	},
};
