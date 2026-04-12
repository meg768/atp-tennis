const Fetcher = require('./fetcher');

class Api extends Fetcher {
	constructor(options = {}) {
		super(options);
		this.options = options;
		this.mysql = options.mysql ?? null;
		this.version = options.version ?? null;
	}
}

module.exports = Api;
