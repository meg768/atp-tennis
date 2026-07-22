const Api = require('./api');
const { getCurrentEvents } = require('./current-events.js');

class ApiEventsCurrent extends Api {
	async fetch() {
		return await getCurrentEvents({ mysql: this.mysql });
	}

	parse(raw) {
		return raw;
	}
}

module.exports = ApiEventsCurrent;
