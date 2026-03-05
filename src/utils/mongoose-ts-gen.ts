import MongooseTsgen from "mongoose-tsgen";

const tsgen = new MongooseTsgen([]);
const main = async () => {
	const result = await tsgen.generateDefinitions({
		flags: {
			"dry-run": false,
			"no-format": false,
			"no-mongoose": false,
			"no-populate-overload": false,
			debug: false,
			output: "./src/models/interfaces",
			project: "./",
		},

		args: {},
	});
	await result.sourceFile.save();
};

main();
