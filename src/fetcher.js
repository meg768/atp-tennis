const Gopher = require('./gopher');

class Fetcher {
	constructor(options) {
		this.log = options?.log || console.log;
	}

	async fetchATP(url, options) {
		const defaultHeaders = {
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
        console.log(`Fetching URL: ${url}`);
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
