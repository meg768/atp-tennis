const Fetcher = require('./fetcher');

class Api extends Fetcher {
	constructor(options = {}) {
		super(options);
		this.options = options;
		this.mysql = options.mysql ?? null;
		this.version = options.version ?? null;
		this.request = options.request ?? null;
		this.response = options.response ?? null;
	}

	getRequestOptions() {
		return {
			...(this.request?.body || {}),
			...(this.request?.query || {}),
			...(this.request?.params || {})
		};
	}

	resolveOptions(options = null) {
		return options ?? this.getRequestOptions();
	}

	async run() {
		let raw = await this.fetch();
		return await this.parse(raw);
	}
}

module.exports = Api;
