const Fetcher = require('./fetcher');
const PlayerRankings = require('./player-rankings');

class FetchTopPlayers extends Fetcher {
	constructor(options) {
		super(options);
	}

	parse(raw) {
		return PlayerRankings.parseGateway(raw);
	}

	async fetch(options = {}) {
		let top = Number.isFinite(Number(options.top)) ? Math.max(1, Math.trunc(Number(options.top))) : 100;
		const url = PlayerRankings.gatewayUrl(top);

		try {
			return await this.fetchATP(url, options);
		} catch (error) {
			if (!error.nonRetryable) {
				throw error;
			}

			this.log(`ATP rankings gateway blocked; falling back to rankings page.`);
			const html = await this.fetchURL(PlayerRankings.pageUrl(top), {
				...options,
				responseType: 'text',
				headers: {
					Accept: 'text/html',
					Referer: 'https://www.atptour.com/en/rankings/singles',
					...(options?.headers || {})
				}
			});

			return PlayerRankings.parsePage(html, top);
		}
	}
}

module.exports = FetchTopPlayers;
