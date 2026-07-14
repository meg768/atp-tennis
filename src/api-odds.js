const Api = require('./api');

class ApiOdds extends Api {
	async fetchOdds(playerA, playerB, surface) {
		let rows = await this.mysql.query({
			sql: 'CALL PLAYER_ODDS(?, ?, ?)',
			format: [playerA, playerB, surface || null]
		});

		rows = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows;

		if (!Array.isArray(rows) || rows.length !== 2) {
			throw new Error('Could not calculate odds.');
		}

		const odds = {
			TA: rows.map(row => Number(row.TA)),
			GPT: rows.map(row => Number(row.GPT))
		};

		if ([...odds.TA, ...odds.GPT].some(value => !Number.isFinite(value))) {
			throw new Error('Could not calculate odds.');
		}

		return odds;
	}

	async fetch(options = null) {
		let { playerA, playerB, surface = null } = this.resolveOptions(options);
		playerA = String(playerA || '').trim();
		playerB = String(playerB || '').trim();
		surface = surface == null ? null : String(surface).trim();

		if (!playerA || !playerB) {
			throw new Error('playerA and playerB parameters are required.');
		}

		if (playerA.toUpperCase() === playerB.toUpperCase()) {
			throw new Error('playerA and playerB must be different.');
		}

		return {
			odds: await this.fetchOdds(playerA, playerB, surface)
		};
	}

	parse(raw) {
		return raw;
	}
}

module.exports = ApiOdds;
