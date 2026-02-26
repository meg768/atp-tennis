let Command = require('../src/command.js');
let LiveFetcher = require('../src/fetch-live.js');

class Module extends Command {
	constructor() {
		super({ command: 'monitor [options]', description: 'Log ongoing ATP live singles matches' });
	}

	arguments(args) {
		args.option('interval', {
			alias: 'i',
			describe: 'Polling interval in seconds',
			type: 'number',
			default: 30
		});

		args.help();
	}

	sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async run(argv) {
		this.argv = argv;

		const liveFetcher = new LiveFetcher({});

		while (true) {

			try {
				const rows = await liveFetcher.fetch();
                console.log(JSON.stringify(rows, null, 2)); // Log the raw data for debugging

			} catch (error) {
				console.error(`Monitor failed: ${error.message}`);
			}


			await this.sleep(this.argv.interval * 1000);
		}
	}
}

module.exports = new Module();
