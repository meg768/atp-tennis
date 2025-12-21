const Gopher = require('./gopher');

class Fetcher {
	constructor(options) {
		this.log = options?.log || console.log;
	}

	async fetchATP(url, options) {
		const defaultHeaders = {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
			Accept: 'application/json, text/plain, */*',
			'Accept-Language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7',
			Referer: 'https://app.atptour.com/',
			Origin: 'https://app.atptour.com'
		};

		options = {
			...options,
			headers: {
				...defaultHeaders,
				...(options?.headers || {})
			}
		};

        return await this.fetchURL(url, options)
	}

	async fetchURL(url, options) {
		return await Gopher.fetch(url, options);
	}

	output({ fileName, json }) {
		if (typeof fileName === 'string' && json) {
			const text = JSON.stringify(json, null, '   ');
			const fs = require('fs');
			fs.writeFileSync(fileName, text);
			this.log(text);
		}
	}
}

module.exports = Fetcher;
