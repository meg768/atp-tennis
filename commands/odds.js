const Command = require('../src/command');
const CollectOdds = require('../src/collect-odds');

class Odds extends Command {
	constructor() {
		super({ command: 'odds', description: 'Save current Svenska Spel pre-match odds' });
	}

	async run() {
		const mysql = require('../src/mysql');
		try {
			await mysql.connect();
			await new CollectOdds({ mysql }).run();
		} catch (error) {
			console.error(`Odds collection failed: ${error.message}`);
			process.exitCode = 1;
		} finally {
			await mysql.disconnect();
		}
	}
}

module.exports = new Odds();
