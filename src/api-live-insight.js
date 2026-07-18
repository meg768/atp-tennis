const Api = require('./api');

function tiebreaksForPlayer(rows, playerId) {
	let wins = 0;
	let losses = 0;
	let latest = [];

	for (const row of rows) {
		const playerWonMatch = row.winner === playerId;
		const sets = String(row.score || '').match(/\d+-\d+(?:\(\d+\))?/g) || [];
		for (const set of sets) {
			const [left, right] = set.split('-').map(value => Number.parseInt(value, 10));
			if (!((left === 7 && right === 6) || (left === 6 && right === 7))) continue;
			const won = playerWonMatch ? left === 7 : right === 7;
			if (won) wins += 1;
			else losses += 1;
			if (latest.length < 10) latest.push(won);
		}
	}

	return {
		wins,
		losses,
		total: wins + losses,
		winPercentage: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : null,
		last10: {
			wins: latest.filter(Boolean).length,
			losses: latest.filter(value => !value).length,
			total: latest.length
		}
	};
}

class ApiLiveInsight extends Api {
	async fetch() {
		let { playerA, playerB, surface = null, trigger = 'tiebreak' } = this.resolveOptions();
		playerA = String(playerA || '').trim();
		playerB = String(playerB || '').trim();
		surface = surface == null ? null : String(surface).trim();
		if (!playerA || !playerB) throw new Error('playerA and playerB are required.');
		if (trigger !== 'tiebreak') throw new Error(`Unsupported live insight trigger: ${trigger}`);

		const players = await this.mysql.query({
			sql: `
				SELECT id, name
				FROM players
				WHERE id IN (PLAYER_LOOKUP(?), PLAYER_LOOKUP(?))
			`,
			format: [playerA, playerB]
		});
		const resolvedA = players.find(player => player.id === playerA) || players.find(player => player.name === playerA) || players[0];
		const resolvedB = players.find(player => player.id === playerB) || players.find(player => player.name === playerB) || players.find(player => player.id !== resolvedA?.id);
		if (!resolvedA || !resolvedB || resolvedA.id === resolvedB.id) throw new Error('Could not resolve both players.');

		const rows = await this.mysql.query({
			sql: `
				SELECT e.date, e.surface, m.winner, m.loser, m.score
				FROM matches m
				JOIN events e ON e.id = m.event
				WHERE e.date >= CURDATE() - INTERVAL 24 MONTH
				  AND (? IS NULL OR e.surface = ?)
				  AND (m.winner IN (?, ?) OR m.loser IN (?, ?))
				  AND m.score LIKE '%-%'
				ORDER BY e.date DESC, e.id DESC, m.id DESC
			`,
			format: [surface || null, surface || null, resolvedA.id, resolvedB.id, resolvedA.id, resolvedB.id]
		});

		return {
			trigger: 'tiebreak',
			windowMonths: 24,
			surface,
			players: [
				{ id: resolvedA.id, name: resolvedA.name, ...tiebreaksForPlayer(rows.filter(row => row.winner === resolvedA.id || row.loser === resolvedA.id), resolvedA.id) },
				{ id: resolvedB.id, name: resolvedB.name, ...tiebreaksForPlayer(rows.filter(row => row.winner === resolvedB.id || row.loser === resolvedB.id), resolvedB.id) }
			]
		};
	}

	parse(raw) { return raw; }
}

module.exports = ApiLiveInsight;
