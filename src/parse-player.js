
class Module  {
	constructor(options) {
	}

	async parse({ response, player }) {
		let results = {};

		if (!player) {
			throw new Error('Player ID is required');
		}


		let result = {};

		result.player = player.toUpperCase();
		result.name = `${response.FirstName ? response.FirstName + ' ' : ''}${response.LastName}`;
		result.country = response.NatlId;
		result.age = response.Age;
		result.height = response.HeightCm > 0 ? response.HeightCm : null;
		result.weight = response.WeightKg > 0 ? response.WeightKg : null;
		result.url = `https://www.atptour.com${response.ScRelativeUrlPlayerProfile}`;

		result.pro = response.ProYear;
		result.coach = response.Coach;
		result.active = response.Active?.Description == 'Active';

		result.ranking = {};
		result.matches = {};
		result.titles = {};
		result.prize = {};

		result.matches.career = {};
		result.matches.ytd = {};
		result.titles.career = {};
		result.titles.ytd = {};

		result.ranking.current = {};
		result.ranking.highest = {};
		result.ranking.current.rank = response.SglRank;
		result.ranking.highest.rank = response.SglHiRank;
		result.ranking.highest.date = response.SglHiRankDate;

		result.titles.ytd = response.SglYtdTitles;
		result.titles.career = response.SglCareerTitles;

		result.prize.ytd = response.SglYtdPrizeFormatted ? response.SglYtdPrizeFormatted.replace(/[^0-9-]/g, '') : null;
		result.prize.career = response.CareerPrizeFormatted ? response.CareerPrizeFormatted.replace(/[^0-9-]/g, '') : null;

		result.matches.ytd.wins = response.SglYtdWon;
		result.matches.ytd.losses = response.SglYtdLost;

		result.matches.career.wins = response.SglCareerWon;
		result.matches.career.losses = response.SglCareerLost;


		return result;
	}
}

module.exports = Module;
