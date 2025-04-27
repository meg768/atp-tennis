let axios = require('axios');

let Command = require('../src/command.js');

class Module extends Command {
	constructor() {
		super({ command: 'events [options]', description: 'List events' });
	}

	arguments(args) {
		args.help();
	}

	log(message) {
		console.log(message);
	}

	async fetch(eventID) {
		let response = await axios.get('https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear=2024&eventid=404', {
			headers: {
				'User-Agent': 'YourAppName/1.0'
			}
		});
		console.log(response.data);
	}

	async run(argv) {
		await this.fetch(403);
	}
}

module.exports = new Module();
