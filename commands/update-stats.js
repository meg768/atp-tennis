let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');

class Module extends Command {
	constructor() {
		super({ command: 'update-stats [options]', description: 'Fetch player statistics' });
		this.mysql = new MySQL();
	}

	arguments(args) {
		args.help();
	}

	async run(argv) {
		this.argv = argv;

		this.mysql.connect();

		await this.mysql.query(`UPDATE players SET serve_rating = NULL, return_rating = NULL, pressure_rating = NULL`);

		let Fetcher = require('../src/fetch-stats.js');
		let fetcher = new Fetcher();
		let details = await fetcher.fetch({});

		for (let entry of details) {
			let sql = ``;
			sql += `UPDATE players SET `;
			sql += `serve_rating = ?, `;
			sql += `return_rating = ?, `;
			sql += `pressure_rating = ? `;
			sql += `WHERE id = ?`;

			let format = [entry.serve, entry.return, entry.pressure, entry.player];

			await this.mysql.query({ sql, format });
		}
		this.mysql.disconnect();
	}
}

module.exports = new Module();
