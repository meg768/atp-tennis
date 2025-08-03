
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');
let Fetcher = require('../src/fetch-player.js');

class Module extends Command {
	constructor() {
		super({ command: 'player [options]', description: 'Fetch player info' });
		this.mysql = require('../src/mysql.js');
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
			default: './output/player.json'
		});

		args.help();
	}

	async run(argv) {
		this.argv = argv;

		let fetcher = new Fetcher();
		let json = await fetcher.fetch({ player: this.argv.player });

		fetcher.output({ fileName: this.argv.output, json });
	}
}

module.exports = new Module();
