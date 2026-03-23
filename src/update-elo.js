class UpdateELO {
	constructor({ mysql, log } = {}) {
		if (!mysql) {
			throw new Error('MySQL instance is required.');
		}

		this.mysql = mysql;
		this.log = typeof log === 'function' ? log : console.log;
	}

	async compute(surface) {
		const surfaces = ['Hard', 'Clay', 'Grass'];

		if (surface != undefined && !surfaces.includes(surface)) {
			throw new Error(`Unsupported surface '${surface}'.`);
		}

		let elo = {};
		let count = {};
		let sql = `
			SELECT
				m.id,
				m.winner AS winner_id,
				m.loser AS loser_id,
				e.type AS event_type
			FROM matches m
			JOIN events e ON e.id = m.event
			WHERE
				e.date IS NOT NULL
				AND m.winner IS NOT NULL
				AND m.loser IS NOT NULL
				AND m.status = 'Completed'
		`;

		let format = [];

		if (surface != undefined) {
			sql += ` AND e.surface = ?`;
			format.push(surface);
		}

		sql += ` ORDER BY e.date ASC, m.id ASC`;

		let matches = await this.mysql.query({ sql, format });

		for (let match of matches) {
			let { winner_id: playerA, loser_id: playerB } = match;

			if (!playerA || !playerB) {
				continue;
			}

			let matchesA = count[playerA] || 0;
			let matchesB = count[playerB] || 0;

			let eloA = elo[playerA] || { rank: 1500, id: playerA };
			let eloB = elo[playerB] || { rank: 1500, id: playerB };

			let rA = eloA.rank;
			let rB = eloB.rank;

			let eA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
			let eB = 1 / (1 + Math.pow(10, (rA - rB) / 400));

			let sA = 1;
			let sB = 0;

			let kA = 250 / Math.pow(matchesA + 5, 0.4);
			let kB = 250 / Math.pow(matchesB + 5, 0.4);

			let k = match.event_type == 'Grand Slam' ? 1.1 : 1;

			eloA.rank = rA + k * kA * (sA - eA);
			eloB.rank = rB + k * kB * (sB - eB);

			elo[playerA] = eloA;
			elo[playerB] = eloB;

			count[playerA] = matchesA + 1;
			count[playerB] = matchesB + 1;
		}

		return Object.values(elo);
	}

	async run() {
		await this.log('Updating ELO ratings...');
		let all = await this.compute();
		let hard = await this.compute('Hard');
		let clay = await this.compute('Clay');
		let grass = await this.compute('Grass');

		await this.mysql.query('UPDATE players SET elo_rank = NULL, elo_rank_hard = NULL, elo_rank_clay = NULL, elo_rank_grass = NULL');

		for (let elo of all) {
			await this.mysql.query({
				sql: 'UPDATE players SET elo_rank = ? WHERE id = ?',
				format: [elo.rank, elo.id]
			});
		}

		for (let elo of hard) {
			await this.mysql.query({
				sql: 'UPDATE players SET elo_rank_hard = ? WHERE id = ?',
				format: [elo.rank, elo.id]
			});
		}

		for (let elo of clay) {
			await this.mysql.query({
				sql: 'UPDATE players SET elo_rank_clay = ? WHERE id = ?',
				format: [elo.rank, elo.id]
			});
		}

		for (let elo of grass) {
			await this.mysql.query({
				sql: 'UPDATE players SET elo_rank_grass = ? WHERE id = ?',
				format: [elo.rank, elo.id]
			});
		}
	}
}

module.exports = UpdateELO;
