const Fetcher = require('./fetcher');

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch({ top = 10, raw}) {
		let results = {};

		if (!top) {
			throw new Error('Top players count is required');
		}

		let url = `https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=${top}`;
		let response = await this.fetchURL(url);

		if (raw != undefined && (raw == '' || raw != 0)) {
			return response;
		}


		let result = {};

		result.players = response.Data.Rankings.Players.map((player) => {
			return {
				date:response.Data.Rankings.RankDate,
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
