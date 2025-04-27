let Command = require('../src/command.js');
let Fetcher = require('../src/fetch-scores.js');

class Module extends Command {
	constructor() {
		super({ command: 'scores [options]', description: 'Fetch scores' });
	}

	arguments(args) {
		args.option('output', {
			alias: 'o',
			describe: 'Output to file',
			type: 'string',
			default: './output/scores.json'
		});
		args.option('event', {
			alias: 'e',
			describe: 'Event ID',
			type: 'string',
			default: '2024-0339'
		});
		args.help();
	}

	async run(argv) {
		this.argv = argv;

		let fetcher = new Fetcher();
		let json = await fetcher.fetch({ event: this.argv.event });

		fetcher.output({ fileName: this.argv.output, json });
	}
}

module.exports = new Module();
