const Gopher = require('./gopher');

class Module {
	constructor(options) {
		this.log = options?.log || console.log;
	}


	async fetchURL(url, options) {
		this.log(`Fetching URL ${url}...`);
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

module.exports = Module;
