const Fetcher = require('./fetcher');

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch(options = {}) {
		let results = {};

		const url = 'https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=100';

		let response = await this.fetchATP(url, options);

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

		if (!response) {
			return results;
		}

		return result;
	}
}

module.exports = Module;
