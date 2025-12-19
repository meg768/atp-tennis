const Fetcher = require('./fetcher');

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch({ player, raw }) {
		let results = {};

		if (!player) {
			throw new Error('Player ID is required');
		}

		let url = `https://www.atptour.com/en/-/www/players/hero/${player}`;
		let response = await this.fetchATP(url);

		if (!response) {
			return null;
		}

		if (raw != undefined && (raw == '' || raw != 0)) {
			return response;
		}

		let result = {};

		result.player = player.toUpperCase();
		result.name = `${response.FirstName ? response.FirstName + ' ' : ''}${response.LastName}`;
		result.country = response.NatlId;
		result.age = response.Age;
		result.birthdate = response.BirthDate ? response.BirthDate.split('T')[0] : null;
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

		result.raw = response;

		if (!response) {
			return results;
		}

		return result;
	}
}

module.exports = Module;
