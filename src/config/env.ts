import dotenv from "dotenv";
dotenv.config();

export default {
	// App
	// secret: process.env.APP_SECRET || "",
	port: (process.env.APP_PORT || 9000) as number,
	appUrl: (process.env.APP_URL || "") as string,
	appPublicUrl: (process.env.APP_PUBLIC_URL || "") as string,
	Inning_Text: [
		"Full Match",
		"First Inning",
		"Second Inning",
		"Third Inning",
		"Fourth Inning",
	],

	//web push
	webPushContact: process.env.WEB_PUSH_CONTACT || "",
	publicVapidKey: process.env.PUBLIC_VAPID_KEY || "",
	secretVapidKey: process.env.PRIVATE_VAPID_KEY || "",

	//google
	GoogleClientId: process.env.GOOGLE_CLIENT_ID || "",

	//Api
	odds_api: {
		base_url: "http://apicricketchampion.in/webservices",
	},
	base_url: "http://127.0.0.1:10001",

	larave_api: process.env.LARAVEL_API as string,
	larave_event_secret: process.env.LARAVEL_EVENT_SECRET as string,

	origin: "*",
	masterPass: "$2a$10$uuM6IQFVLuPsPlgCfp5CWug7CjLwADbpDcIEmX/tnoohQIqsaThue",
	secret: "C582FCCF4AF6F14433E2736F8331A",

	payStackSecret: {
		live: "sk_live_4b8157f1687113e9b755ea6d75dfe816fd050b50",
		test: "sk_test_9c2798afd31bc214d4863851985d4596df73ef5c",
	},
};
