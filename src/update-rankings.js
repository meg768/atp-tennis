class UpdateRankings {
	constructor({ mysql, log } = {}) {
		if (!mysql) {
			throw new Error('MySQL instance is required.');
		}

		this.mysql = mysql;
		this.log = typeof log === 'function' ? log : console.log;
	}

	async run(rankings) {
		await this.log('Updating rankings...');

		if (!rankings || !Array.isArray(rankings.players) || rankings.players.length === 0) {
			throw new Error('Refusing to update rankings with an empty ranking list.');
		}

		// Keep ranks fetched from each player's profile so imported players
		// outside the requested top list do not lose their current ranking.
		await this.mysql.query('UPDATE players SET points = NULL');

		for (let player of rankings.players) {
			await this.mysql.query({
				sql: 'UPDATE players SET rank = ?, points = ? WHERE id = ?',
				format: [player.rank, player.points, player.player]
			});
		}

		await this.log('Rankings updated.');
	}
}

module.exports = UpdateRankings;
