let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');
let Fetcher = require('../src/fetch-player.js');

class Module extends Command {
	constructor() {
		super({ command: 'fetch-player [options]', description: 'Fetch player info' });
		this.mysql = new MySQL();
	}

	arguments(args) {
		args.option('player', {
			alias: 'p',
			describe: 'Player ID',
			type: 'string',
			default: 'S0AG'
		});

		args.option('output', {
			alias: 'o',
			describe: 'Output to file',
			type: 'string',
			default: 'fetch-player.json'
		});

		args.help();
	}

	async run(argv) {
		this.argv = argv;

		let fetcher = new Fetcher();
		let json = await fetcher.fetch({ player: this.argv.player });

		fetcher.output({ fileName: this.argv.output, json });
		console.log(JSON.stringify(json, null, 2));
	}
}

module.exports = new Module();
