let Probe = require('../src/probe.js');
let Command = require('../src/command.js');

class Module extends Command {
	constructor() {
		super({ command: 'update-players [options]', description: 'Update player info' });
		this.mysql = require('../src/mysql.js');
	}

	arguments(args) {
		args.help();
	}

	async run(argv) {
		this.argv = argv;

		await this.mysql.connect();
		let players = await this.mysql.query(`SELECT id FROM players WHERE birthdate IS NULL`);

		this.mysql.log(`Updating ${players.length} players...`);

		for (let player of players) {

			try {
				let Fetcher = require('../src/fetch-player.js');
				let fetcher = new Fetcher();
				let details = await fetcher.fetch({ player: player.id });

				if (!details) {
					continue;
				}

				if (!details.birthdate) {
					continue;
				}
				
				let sql = ``;
				sql += `UPDATE players SET `;
				sql += `birthdate = ? `;
				sql += `WHERE id = ?`;

				let format = [details.birthdate, details.player];

				await this.mysql.query({ sql, format });

			} catch (error) {
				await this.log(error.message);
			}
		}


		await this.mysql.disconnect();
	}
}

module.exports = new Module();
