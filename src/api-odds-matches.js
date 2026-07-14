const Api = require('./api');
const ApiOdds = require('./api-odds.js');

const MAX_MATCHES = 100;

class ApiOddsMatches extends Api {
	async fetch(options = null) {
		const { matches } = this.resolveOptions(options);

		if (!Array.isArray(matches)) {
			throw new Error('matches must be an array.');
		}

		if (matches.length > MAX_MATCHES) {
			throw new Error(`matches may contain at most ${MAX_MATCHES} entries.`);
		}

		const parallelMysql = {
			query: params => this.mysql.parallelQuery(params)
		};
		const oddsApi = new ApiOdds({ mysql: parallelMysql, log: this.log });
		return await Promise.all(matches.map(async (match, index) => {
			const key = String(match?.key ?? index);

			try {
				const odds = await oddsApi.fetch({
					playerA: match?.playerA,
					playerB: match?.playerB,
					surface: match?.surface ?? null
				});

				return { key, ...odds, error: null };
			} catch (error) {
				return {
					key,
					odds: {
						TA: null,
						GPT: null
					},
					error: error instanceof Error ? error.message : String(error)
				};
			}
		}));
	}

	parse(raw) {
		return raw;
	}
}

module.exports = ApiOddsMatches;
