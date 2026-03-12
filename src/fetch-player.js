const Fetcher = require('./fetcher');

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	parse(payload, { player } = {}) {
		let results = {};

		if (!player) {
			throw new Error('Player ID is required');
		}

		if (!payload) {
			return null;
		}

		let result = {};

		result.player = player.toUpperCase();
		result.name = `${payload.FirstName ? payload.FirstName + ' ' : ''}${payload.LastName}`;
		result.country = payload.NatlId;
		result.age = payload.Age;
		result.birthdate = payload.BirthDate ? payload.BirthDate.split('T')[0] : null;
		result.height = payload.HeightCm > 0 ? payload.HeightCm : null;
		result.weight = payload.WeightKg > 0 ? payload.WeightKg : null;
		result.url = `https://www.atptour.com${payload.ScRelativeUrlPlayerProfile}`;

		result.pro = payload.ProYear;
		result.coach = payload.Coach;
		result.active = payload.Active?.Description == 'Active';

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
		result.ranking.current.rank = payload.SglRank;
		result.ranking.highest.rank = payload.SglHiRank;
		result.ranking.highest.date = payload.SglHiRankDate;

		result.titles.ytd = payload.SglYtdTitles;
		result.titles.career = payload.SglCareerTitles;

		result.prize.ytd = payload.SglYtdPrizeFormatted ? payload.SglYtdPrizeFormatted.replace(/[^0-9-]/g, '') : null;
		result.prize.career = payload.CareerPrizeFormatted ? payload.CareerPrizeFormatted.replace(/[^0-9-]/g, '') : null;

		result.matches.ytd.wins = payload.SglYtdWon;
		result.matches.ytd.losses = payload.SglYtdLost;

		result.matches.career.wins = payload.SglCareerWon;
		result.matches.career.losses = payload.SglCareerLost;

		result.raw = payload;

		if (!payload) {
			return results;
		}

		return result;
	}

	async fetch({ player } = {}) {
		if (!player) {
			throw new Error('Player ID is required');
		}

		let url = `https://www.atptour.com/en/-/www/players/hero/${player}`;
		return await this.fetchATP(url);
	}
}

module.exports = Module;
