const Fetcher = require('./fetcher');

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	parse(raw) {
		if (!raw || typeof raw !== 'object') {
			return [];
		}

		let result = {};
		const typeToField = {
			pressure: 'PressureRating',
			serve: 'ServeRating',
			return: 'ReturnRating'
		};

		let extractStats = ({ type, field }) => {
			let stats = {};
			let leaderboard = raw[type]?.Leaderboard;

			if (Array.isArray(leaderboard)) {
				for (let item of leaderboard) {
					if (!item?.PlayerId) {
						continue;
					}
					stats[item.PlayerId] = item?.Stats?.[field];
				}
			}

			if (stats) {
				let high = undefined;
				let low = undefined;

				for (let [key, value] of Object.entries(stats)) {
					high = high == undefined ? value : Math.max(value, high);
					low = low == undefined ? value : Math.min(value, low);
				}

				for (let [key, value] of Object.entries(stats)) {
					if (!result[key]) {
						result[key] = {};
					}

					result[key].player = key;
					result[key][type] = Math.round((100 * (value - low)) / (high - low));
				}
			}
		};

		for (let [type, field] of Object.entries(typeToField)) {
			extractStats({ type, field });
		}

		let array = [];

		for (let [key, value] of Object.entries(result)) {
			array.push(value);
		}
		return array;
	}

	async fetch() {
		const urls = {
			pressure: 'https://www.atptour.com/en/-/www/StatsLeaderboard/pressure/52week/all/all/false?v=1',
			serve: 'https://www.atptour.com/en/-/www/StatsLeaderboard/serve/52week/all/all/false?v=1',
			return: 'https://www.atptour.com/en/-/www/StatsLeaderboard/return/52week/all/all/false?v=1'
		};

		let payload = {};

		for (let [type, url] of Object.entries(urls)) {
			payload[type] = await this.fetchATP(url);
		}

		return payload;
	}
}

module.exports = Module;
