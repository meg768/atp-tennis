let Command = require('../src/command.js');
let Fetcher = require('../src/fetch-event.js');

class Module extends Command {
	constructor() {
		super({ command: 'fetch-event [options]', description: 'Fetch a specific event' });
	}

	arguments(args) {
		args.option('output', {
			alias: 'o',
			describe: 'Output to file',
			type: 'string',
			default: 'fetch-event.json'
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
		console.log(JSON.stringify(json, null, 2));

		console.log(json);
	}
}

module.exports = new Module();
