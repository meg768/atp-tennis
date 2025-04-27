
class Module  {
	constructor() {
	}

	async parse({response}) {
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


		return result;
	}
}

module.exports = Module;
