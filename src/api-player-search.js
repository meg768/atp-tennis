const Api = require('./api');

class ApiPlayerSearch extends Api {
	async fetch(options = null) {
		options = this.resolveOptions(options);
		let term = String(options.term ?? '').trim();

		if (!term) {
			return [];
		}

		return await this.mysql.query({
			sql: 'CALL PLAYER_SEARCH(?)',
			format: [term]
		});
	}

	parse(raw) {
		return raw;
	}
}

module.exports = ApiPlayerSearch;
