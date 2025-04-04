const Fetcher = require('./fetcher');

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch({ top = 5}) {
		let results = {};

		if (!top) {
			throw new Error('Top players count is required');
		}

		let url = `https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=${top}`;
		let response = await this.fetchURL(url);
		let result = {};

		result.date = response.Data.Rankings.RankDate;
		result.players = response.Data.Rankings.Players.map((player) => {
			return {
				id: player.PlayerId,
				name: `${player.FirstName} ${player.LastName}`,
				age: player.AgeAtRankDate,
				country: player.NatlId,
				rank: player.Rank,
				points: player.Points
			};
		});
		//result.raw = response;

		if (!response) {
			return results;
		}

		return result;
	}
}

module.exports = Module;
