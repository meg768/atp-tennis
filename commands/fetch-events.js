let Command = require('../src/command.js');
let Fetcher = require('../src/fetch-events.js');

class Module extends Command {
	constructor() {
		super({ command: 'fetch-events [options]', description: 'Fetch events top top N players' });
	}

	arguments(args) {
		args.option('output', {
			alias: 'o',
			describe: 'Output to file',
			type: 'string',
			default: 'fetch-events.json'
		});
		args.option('top', {
			alias: 'n',
			describe: 'Fetch events from top N players',
			type: 'number',
			default: undefined
		});
		args.help();
	}

	async run(argv) {
		this.argv = argv;

		let fetcher = new Fetcher();
		let json = await fetcher.fetch({ top: this.argv.top });
		fetcher.output({ fileName: this.argv.output, json });
		console.log(json);
	}
}

module.exports = new Module();
