let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');
let Gopher = require('../src/gopher.js');
let readJSON = require('yow/readJSON');

class Module extends Command {
	constructor() {
		super({ command: 'live [options]', description: 'Fetch live activity' });
		this.mysql = new MySQL();
	}

	arguments(args) {
		args.option('output', {
			alias: 'o',
			describe: 'Output to file',
			type: 'string',
			default: './output/live.json'
		});

		args.option('debug', {
			alias: 'd',
			describe: 'Debug mode',
			type: 'boolean',
			default: false
		});

		args.option('input', {
			alias: 'i',
			describe: 'Input file',
			type: 'string',
			default: './input/live.json'
		});
		args.help();
	}

	async run(argv) {
		this.argv = argv;

		let response = null;

		if (this.argv.debug && this.argv.input) {
			console.log('Reading from input file...');
			response = readJSON(this.argv.input);
		} else {
			console.log('Fetching live activity from ATP API...');
			response = await Gopher.fetch('https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour');
		}

		let Parser = require('../src/parse-live.js');
		let parser = new Parser({ response });
		let json = await parser.parse();

		parser.output({ fileName: this.argv.output, json });
	}
}

module.exports = new Module();
