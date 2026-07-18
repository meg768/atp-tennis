const Api = require('./api');

class ApiPlayerWorkspace extends Api {
	async fetch() {
		const { id: rawId } = this.resolveOptions();
		const term = String(rawId || '').trim();
		if (!term) throw new Error('Player id is required.');

		const players = await this.mysql.query({
			sql: `
				SELECT id, name, country, age, pro, height, weight, rank, points,
					highest_rank AS highestRank,
					DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS highestRankDate,
					career_titles AS careerTitles, career_prize AS careerPrize,
					ytd_wins AS ytdWins, ytd_losses AS ytdLosses,
					elo_rank AS elo, elo_rank_hard AS hardElo,
					elo_rank_clay AS clayElo, elo_rank_grass AS grassElo
				FROM players
				WHERE id = PLAYER_LOOKUP(?)
				LIMIT 1
			`,
			format: [term]
		});

		const player = players[0];
		if (!player) throw new Error(`Player not found: ${term}`);

		const matches = await this.mysql.query({
			sql: `
				SELECT m.id, DATE_FORMAT(e.date, '%Y-%m-%d') AS date,
					e.name AS tournament, e.type, e.surface, m.round, m.score,
					winner.id AS winnerId, winner.name AS winnerName, m.winner_rank AS winnerRank,
					loser.id AS loserId, loser.name AS loserName, m.loser_rank AS loserRank
				FROM matches m
				JOIN events e ON e.id = m.event
				JOIN players winner ON winner.id = m.winner
				JOIN players loser ON loser.id = m.loser
				WHERE e.date IS NOT NULL
				  AND (m.winner = ? OR m.loser = ?)
				ORDER BY e.date DESC, e.id DESC, m.id DESC
				LIMIT 24
			`,
			format: [player.id, player.id]
		});

		return { player, matches };
	}

	parse(raw) {
		return raw;
	}
}

module.exports = ApiPlayerWorkspace;
