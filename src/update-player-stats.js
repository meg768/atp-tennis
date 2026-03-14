class UpdatePlayerStats {
	constructor({ mysql, log, fetchOptions } = {}) {
		if (!mysql) {
			throw new Error('MySQL instance is required.');
		}

		this.mysql = mysql;
		this.log = typeof log === 'function' ? log : console.log;
		this.fetchOptions = fetchOptions || {};
	}

	async run() {
		await this.log('Updating player stats...');
		await this.mysql.query('UPDATE players SET serve_rating = NULL, return_rating = NULL, pressure_rating = NULL');

		let Fetcher = require('./fetch-stats.js');
		let fetcher = new Fetcher(this.fetchOptions);
		let raw = await fetcher.fetch();
		let details = fetcher.parse(raw);

		for (let entry of details) {
			await this.mysql.query({
				sql: `
					UPDATE players
					SET serve_rating = ?, return_rating = ?, pressure_rating = ?
					WHERE id = ?
				`,
				format: [entry.serve, entry.return, entry.pressure, entry.player]
			});
		}
	}
}

module.exports = UpdatePlayerStats;
