const Fetcher = require('./fetcher');

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch({ player }) {
		let results = {};

		if (!player) {
			throw new Error('Player ID is required');
		}

		let url = `https://www.atptour.com/en/-/www/players/hero/${player}`;
		let response = await this.fetchURL(url);

		let result = {};

		result.player = player.toUpperCase();
		result.name = `${response.FirstName} ${response.LastName}`;
		result.country = response.NatlId;
		result.age = response.Age;
		result.height = response.HeightCm;
		result.weight = response.WeightKg;
		result.url = `https://www.atptour.com${response.ScRelativeUrlPlayerProfile}`;

		result.pro = response.ProYear;
		result.active = response.Active?.Description == 'Active';

		result.ranking = {};
		result.matches = {};
		result.matches.career = {};
		result.matches.ytd = {};

		result.ranking.current = {};
		result.ranking.career = {};
		result.ranking.current.rank = response.SglRank;
		result.ranking.career.rank = response.SglHiRank;
		result.ranking.career.date = response.SglHiRankDate;


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
