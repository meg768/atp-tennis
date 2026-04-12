const Api = require('./api');

class ApiOdds extends Api {
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

		let rows = await this.mysql.query({
			sql: 'CALL PLAYER_ODDS(?, ?, ?)',
			format: [playerA, playerB, surface || null]
		});

		rows = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows;

		if (!Array.isArray(rows) || rows.length !== 2) {
			throw new Error('Could not calculate odds.');
		}

		return rows;
	}

	parse(raw) {
		return raw.map(row => row.odds);
	}
}

module.exports = ApiOdds;
