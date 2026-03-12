const Fetcher = require('./fetcher');

class Module extends Fetcher {
	constructor(options) {
		super(options);
		this.player = null;
	}

	parse(raw) {
		const player = this.player;

		if (!player) {
			throw new Error('Player ID is required');
		}

		if (!raw) {
			return null;
		}

		let result = {};

		result.player = player.toUpperCase();
		result.name = `${raw.FirstName ? raw.FirstName + ' ' : ''}${raw.LastName}`;
		result.country = raw.NatlId;
		result.age = raw.Age;
		result.birthdate = raw.BirthDate ? raw.BirthDate.split('T')[0] : null;
		result.height = raw.HeightCm > 0 ? raw.HeightCm : null;
		result.weight = raw.WeightKg > 0 ? raw.WeightKg : null;
		result.url = `https://www.atptour.com${raw.ScRelativeUrlPlayerProfile}`;

		result.pro = raw.ProYear;
		result.coach = raw.Coach;
		result.active = raw.Active?.Description == 'Active';

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
		result.ranking.current.rank = raw.SglRank;
		result.ranking.highest.rank = raw.SglHiRank;
		result.ranking.highest.date = raw.SglHiRankDate;

		result.titles.ytd = raw.SglYtdTitles;
		result.titles.career = raw.SglCareerTitles;

		result.prize.ytd = raw.SglYtdPrizeFormatted ? raw.SglYtdPrizeFormatted.replace(/[^0-9-]/g, '') : null;
		result.prize.career = raw.CareerPrizeFormatted ? raw.CareerPrizeFormatted.replace(/[^0-9-]/g, '') : null;

		result.matches.ytd.wins = raw.SglYtdWon;
		result.matches.ytd.losses = raw.SglYtdLost;

		result.matches.career.wins = raw.SglCareerWon;
		result.matches.career.losses = raw.SglCareerLost;

		result.raw = raw;

		return result;
	}

	async fetch({ player } = {}) {
		if (!player) {
			throw new Error('Player ID is required');
		}

		this.player = String(player).toUpperCase();

		let url = `https://www.atptour.com/en/-/www/players/hero/${this.player}`;
		return await this.fetchATP(url);
	}
}

module.exports = Module;
