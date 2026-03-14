class UpdateELO {
	constructor({ mysql, log } = {}) {
		if (!mysql) {
			throw new Error('MySQL instance is required.');
		}

		this.mysql = mysql;
		this.log = typeof log === 'function' ? log : console.log;
	}

	async compute() {
		function isCompletedSet(a, b) {
			const high = Math.max(a, b);
			const low = Math.min(a, b);
			const diff = high - low;

			if (high < 6) {
				return false;
			}

			if (high === 6) {
				return diff >= 2;
			}

			if (high === 7) {
				return low === 5 || low === 6;
			}

			return diff === 2;
		}

		function parseSetToken(token) {
			const match = token.match(/^(\d+)-(\d+)(?:\(\d+\))?$/);
			if (!match) {
				return null;
			}

			return [parseInt(match[1], 10), parseInt(match[2], 10)];
		}

		function hasCompletedScore(score) {
			if (typeof score !== 'string' || score.trim() === '') {
				return false;
			}

			let completedSets = 0;

			for (const token of score.trim().split(/\s+/)) {
				const games = parseSetToken(token);

				if (!games) {
					return false;
				}

				const [winnerGames, loserGames] = games;

				if (!isCompletedSet(winnerGames, loserGames)) {
					return false;
				}

				completedSets++;
			}

			return completedSets >= 2;
		}

		let elo = {};
		let count = {};
		let matches = await this.mysql.query(`
			SELECT
				m.id,
				m.winner AS winner_id,
				m.loser AS loser_id,
				m.score,
				e.type AS event_type
			FROM matches m
			JOIN events e ON e.id = m.event
			WHERE
				e.date IS NOT NULL
				AND m.winner IS NOT NULL
				AND m.loser IS NOT NULL
				AND m.status = 'Completed'
				AND m.score IS NOT NULL
				AND m.score <> ''
			ORDER BY e.date ASC, m.id ASC
		`);

		for (let match of matches) {
			let { winner_id: playerA, loser_id: playerB } = match;

			if (!playerA || !playerB) {
				continue;
			}

			if (!hasCompletedScore(match.score)) {
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

		return elo;
	}

	async run() {
		await this.log('Updating ELO ratings...');
		let rankings = await this.compute();

		await this.mysql.query('UPDATE players SET elo_rank = NULL');

		for (let elo of Object.values(rankings)) {
			await this.mysql.query({
				sql: 'UPDATE players SET elo_rank = ? WHERE id = ?',
				format: [elo.rank, elo.id]
			});
		}
	}
}

module.exports = UpdateELO;
