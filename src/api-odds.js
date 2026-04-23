const Api = require('./api');
const ApiTennisAbstractOdds = require('./api-tennis-abstract-odds.js');

class ApiOdds extends Api {
	async fetchMyOdds(playerA, playerB, surface) {
		let rows = await this.mysql.query({
			sql: 'CALL PLAYER_ODDS(?, ?, ?)',
			format: [playerA, playerB, surface || null]
		});

		rows = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows;

		if (!Array.isArray(rows) || rows.length !== 2) {
			throw new Error('Could not calculate odds.');
		}

		return rows.map(row => row.odds);
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

		const tennisAbstractApi = new ApiTennisAbstractOdds({
			mysql: this.mysql,
			log: this.log
		});
		const [computedOdds, tennisAbstract] = await Promise.all([
			this.fetchMyOdds(playerA, playerB, surface),
			tennisAbstractApi.fetch({ playerA, playerB, surface })
		]);

		return {
			computedOdds,
			tennisAbstractOdds: tennisAbstract.odds
		};
	}

	parse(raw) {
		return raw;
	}
}

module.exports = ApiOdds;
