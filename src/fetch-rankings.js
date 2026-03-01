const Fetcher = require('./fetcher');

class FetchRankings extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch(options = {}) {
		let results = {};
		let top = Number.isFinite(Number(options.top)) ? Math.max(1, Math.trunc(Number(options.top))) : 100;

		const url = `https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=${top}`;

		let response = await this.fetchATP(url, options);

		if (!response) {
			return results;
		}

		let result = {};

		result.players = response.Data.Rankings.Players.map(player => {
			return {
				date: response.Data.Rankings.RankDate,
				player: player.PlayerId,
				name: `${player.FirstName} ${player.LastName}`,
				age: player.AgeAtRankDate,
				country: player.NatlId,
				rank: player.Rank,
				points: player.Points
			};
		});

		return result;
	}
}

module.exports = FetchRankings;
