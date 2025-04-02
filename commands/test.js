let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');
let FetchMatches = require('../src/fetch-matches.js');

class Module extends Command {
	constructor() {
		super({ command: 'test [options]', description: 'Test' });
		this.mysql = new MySQL();
	}

	arguments(args) {
		args.help();
	}

	async run(argv) {
		this.argv = argv;

		let fetcher = new FetchMatches();
		let matches = await fetcher.fetch({eventYear: 2025, eventID: 403});
		console.log(matches);

	}
}

module.exports = new Module();
