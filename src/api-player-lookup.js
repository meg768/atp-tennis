const Api = require('./api');

class ApiPlayerLookup extends Api {

	async fetch(options = {}) {
		let query = String(options.searchTerm ?? options.query ?? options.term ?? '').trim();

		if (!query) {
			return [];
		}

		return await this.mysql.query({
			sql: 'SELECT PLAYER_LOOKUP(?) AS id',
			format: [query]
		});
	}

	parse(raw) {
		return raw;
	}
}

module.exports = ApiPlayerLookup;
