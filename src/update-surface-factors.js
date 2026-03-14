class UpdateSurfaceFactors {
	constructor({ mysql, log } = {}) {
		if (!mysql) {
			throw new Error('MySQL instance is required.');
		}

		this.mysql = mysql;
		this.log = typeof log === 'function' ? log : console.log;
	}

	async run() {
		await this.log('Updating surface factors...');
		await this.mysql.query('UPDATE players SET clay_factor = NULL, grass_factor = NULL, hard_factor = NULL');

		let activePlayers = await this.mysql.query('SELECT id FROM players WHERE active = 1');
		let activeSet = new Set(activePlayers.map(player => player.id));

		if (activeSet.size === 0) {
			await this.log('Surface factors updated.');
			return;
		}

		let rows = await this.mysql.query(`
			SELECT
				player_id,
				surface,
				SUM(is_win) AS wins,
				COUNT(*) AS matches_played
			FROM (
				SELECT
					m.winner AS player_id,
					e.surface AS surface,
					1 AS is_win,
					e.date AS event_date
				FROM matches m
				JOIN events e ON e.id = m.event
				WHERE m.winner IS NOT NULL

				UNION ALL

				SELECT
					m.loser AS player_id,
					e.surface AS surface,
					0 AS is_win,
					e.date AS event_date
				FROM matches m
				JOIN events e ON e.id = m.event
				WHERE m.loser IS NOT NULL
			) recent_matches
			WHERE
				event_date >= CURDATE() - INTERVAL 2 YEAR
				AND surface IN ('Clay', 'Grass', 'Hard')
			GROUP BY player_id, surface
		`);

		let factors = new Map();

		for (let row of rows) {
			if (!activeSet.has(row.player_id)) {
				continue;
			}

			if (!factors.has(row.player_id)) {
				factors.set(row.player_id, { Clay: null, Grass: null, Hard: null });
			}

			let matchesPlayed = Number(row.matches_played);
			let wins = Number(row.wins);
			let value = Number.isFinite(matchesPlayed) && matchesPlayed > 0 && Number.isFinite(wins)
				? Math.round((wins * 100) / matchesPlayed)
				: null;

			factors.get(row.player_id)[row.surface] = value;
		}

		for (let playerId of activeSet) {
			let value = factors.get(playerId) || { Clay: null, Grass: null, Hard: null };

			await this.mysql.query({
				sql: 'UPDATE players SET clay_factor = ?, grass_factor = ?, hard_factor = ? WHERE id = ?',
				format: [value.Clay, value.Grass, value.Hard, playerId]
			});
		}

		await this.log('Surface factors updated.');
	}
}

module.exports = UpdateSurfaceFactors;
