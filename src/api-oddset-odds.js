const Api = require('./api');
const searchPlayers = require('./search-players.js');
const ApiOddset = require('./api-oddset.js');

function normalizeName(name = '') {
	return String(name)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9 ]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function createPlayersKey(playerAName, playerBName) {
	const playerA = normalizeName(playerAName);
	const playerB = normalizeName(playerBName);

	if (!playerA || !playerB) {
		return null;
	}

	return [playerA, playerB].sort().join('::');
}

class ApiOddsetOdds extends Api {

	async resolvePlayer(term) {
		const rows = await searchPlayers(this.mysql, term, 5);

		if (rows.length === 0) {
			throw new Error(`Player not found: ${term}`);
		}

		return rows[0];
	}

	async fetch(options = {}) {
		let playerA = String(options.playerA || '').trim();
		let playerB = String(options.playerB || '').trim();

		if (!playerA || !playerB) {
			throw new Error('playerA and playerB parameters are required.');
		}

		if (playerA.toUpperCase() === playerB.toUpperCase()) {
			throw new Error('playerA and playerB must be different.');
		}

		const [resolvedA, resolvedB] = await Promise.all([
			this.resolvePlayer(playerA),
			this.resolvePlayer(playerB)
		]);

		if (String(resolvedA.id).toUpperCase() === String(resolvedB.id).toUpperCase()) {
			throw new Error('playerA and playerB resolved to the same player.');
		}

		const apiOddset = new ApiOddset(options);
		const rows = await apiOddset.fetchRows(options);
		const requestedKey = createPlayersKey(resolvedA.name, resolvedB.name);

		const row = rows.find(candidate => createPlayersKey(candidate.playerA, candidate.playerB) === requestedKey);

		if (!row) {
			throw new Error(`Could not find Oddset odds for ${resolvedA.name} vs ${resolvedB.name}.`);
		}

		const rowPlayerA = normalizeName(row.playerA);
		const resolvedPlayerA = normalizeName(resolvedA.name);
		const isSameOrder = rowPlayerA === resolvedPlayerA;

		return {
			playerA: resolvedA,
			playerB: resolvedB,
			match: row,
			odds: isSameOrder ? [row.oddsA, row.oddsB] : [row.oddsB, row.oddsA]
		};
	}

	parse(raw) {
		return raw.odds;
	}
}

module.exports = ApiOddsetOdds;
