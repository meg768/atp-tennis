const Fetcher = require('./fetcher');

class FetchRankings extends Fetcher {
	constructor(options) {
		super(options);
	}

	parse(raw) {
		if (!raw?.Data?.Rankings?.Players || !Array.isArray(raw.Data.Rankings.Players)) {
			return { players: [] };
		}

		return {
			players: raw.Data.Rankings.Players.map(player => {
				return {
					date: raw.Data.Rankings.RankDate,
					player: player.PlayerId,
					name: `${player.FirstName} ${player.LastName}`,
					age: player.AgeAtRankDate,
					country: player.NatlId,
					rank: player.Rank,
					points: player.Points
				};
			})
		};
	}

	async fetch(options = {}) {
		let top = Number.isFinite(Number(options.top)) ? Math.max(1, Math.trunc(Number(options.top))) : 100;

		const url = `https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=${top}`;

		return await this.fetchATP(url, options);
	}
}

module.exports = FetchRankings;
