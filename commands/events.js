let Command = require('../src/command.js');
let Fetcher = require('../src/fetcher.js');

class Module extends Command {
	constructor() {
		super({ command: 'events [options]', description: 'List events' });
		this.fetcher = new Fetcher();
	}

	arguments(args) {
		args.help();
	}

	log(message) {
		console.log(message);
	}

	async fetch(eventID) {
		let url = `https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear=2024&eventid=${eventID}`;
		let response = await this.fetcher.fetchATP(url, {
			headers: {
				'User-Agent': 'YourAppName/1.0'
			}
		});
		console.log(response);
	}

	async run(argv) {
		await this.fetch(403);
	}
}

module.exports = new Module();
