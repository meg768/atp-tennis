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

	async fetch(options = null) {
		options = this.resolveOptions(options);
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

		const apiOddset = new ApiOddset({ mysql: this.mysql, log: this.log });
		const rows = await apiOddset.parse(await apiOddset.fetch(options));
		const requestedKey = createPlayersKey(resolvedA.name, resolvedB.name);

		const row = rows.find(candidate => createPlayersKey(candidate.playerA?.name, candidate.playerB?.name) === requestedKey);

		if (!row) {
			throw new Error(`Could not find Oddset odds for ${resolvedA.name} vs ${resolvedB.name}.`);
		}

		const rowPlayerA = normalizeName(row.playerA?.name);
		const resolvedPlayerA = normalizeName(resolvedA.name);
		const isSameOrder = rowPlayerA === resolvedPlayerA;

		return {
			playerA: resolvedA,
			playerB: resolvedB,
			match: row,
			odds: isSameOrder ? [row.playerA?.odds, row.playerB?.odds] : [row.playerB?.odds, row.playerA?.odds]
		};
	}

	parse(raw) {
		return raw.odds;
	}
}

module.exports = ApiOddsetOdds;
