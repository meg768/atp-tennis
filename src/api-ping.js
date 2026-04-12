const Api = require('./api');

class ApiPing extends Api {

	async fetch() {
		return {
			message: 'pong',
			version: this.version
		};
	}

	parse(raw) {
		return raw;
	}
}

module.exports = ApiPing;
