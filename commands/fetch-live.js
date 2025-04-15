let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');
let Fetcher = require('../src/fetch-live.js');

class Module extends Command {
	constructor() {
		super({ command: 'fetch-live [options]', description: 'Fetch live activity' });
		this.mysql = new MySQL();
	}

	arguments(args) {
		args.option('output', {
			alias: 'o',
			describe: 'Output to file',
			type: 'string',
			default: 'fetch-live.json'
		});

		args.help();
	}

	async run(argv) {
		this.argv = argv;

		let fetcher = new Fetcher();
		let json = await fetcher.fetch({  });

		fetcher.output({ fileName: this.argv.output, json });
		console.log(JSON.stringify(json, null, 2));
	}
}

module.exports = new Module();
