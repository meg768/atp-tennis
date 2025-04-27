let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');
let Fetcher = require('../src/fetch-activity.js');

class Module extends Command {
	constructor() {
		super({ command: 'activity [options]', description: 'Fetch player activity' });
		this.mysql = new MySQL();
	}

	arguments(args) {
		args.option('player', {
			alias: 'p',
			describe: 'Player ID',
			type: 'string',
			default: 'R0DG'
		});

		args.option('since', {
			alias: 's',
			describe: 'Since year',
			type: 'number',
			default: '2020'
		});

		args.option('output', {
			alias: 'o',
			describe: 'Output to file',
			type: 'string',
			default: './output/activity.json'
		});

		args.help();
	}

	async run(argv) {
		this.argv = argv;

		let fetcher = new Fetcher();
		let json = await fetcher.fetch({ player: this.argv.player, since: this.argv.since });

		fetcher.output({ fileName: this.argv.output, json });
		//console.log(JSON.stringify(json, null, 2));
	}
}

module.exports = new Module();
