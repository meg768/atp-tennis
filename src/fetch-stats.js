const { raw } = require('mysql');
const Fetcher = require('./fetcher');

let now = new Date();
let year = now.getFullYear();

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch() {
		let result = {};

		let fetchStats = async ({ type, field }) => {
			let results = {};

			let url = `https://www.atptour.com/en/-/www/StatsLeaderboard/${type}/52week/all/all/false?v=1`;
			let response = await this.fetchURL(url);

			if (!response) {
				return null;
			}


			for (let item of response.Leaderboard) {
				results[item.PlayerId] = item.Stats[field];
			}

			return results;
		};

		let extractStats = async ({ type, field }) => {
			let stats = await fetchStats({ type: type, field: field });

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

		await extractStats({ type: 'pressure', field: 'PressureRating' });
		await extractStats({ type: 'serve', field: 'ServeRating' });
		await extractStats({ type: 'return', field: 'ReturnRating' });

		let array = [];

		for (let [key, value] of Object.entries(result)) {
			array.push(value);
		}
		return array;
	}
}

module.exports = Module;
