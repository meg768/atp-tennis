let Command = require('../src/command.js');
let Fetcher = require('../src/fetch-rankings.js');

class Module extends Command {
	constructor() {
		super({ command: 'rankings [options]', description: 'Fetch player rankings' });
	}

	arguments(args) {
		args.option('top', {
			alias: 't',
			describe: 'Top players',
			type: 'number',
			default: undefined
		});

		args.option('output', {
			alias: 'o',
			describe: 'Output to file',
			type: 'string',
			default: './output/rankings.json'
		});

		args.help();
	}

	async run(argv) {
		console.log('Fetching player rankings...');
		this.argv = argv;

		let fetcher = new Fetcher();
		let json = await fetcher.fetch({ top: this.argv.top });

		fetcher.output({ fileName: this.argv.output, json });
	}
}

module.exports = new Module();
