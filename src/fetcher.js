const Gopher = require('./gopher');

class Module {
	constructor(options) {
		this.log = options?.log || console.log;
	}


	async fetchURL(url) {
		this.log(`Fetching URL ${url}...`);
		return await Gopher.fetch(url);
	}

	output({ fileName, json }) {
		if (typeof fileName === 'string' && json) {
			const fs = require('fs');
			fs.writeFileSync(fileName, JSON.stringify(json, null, '\t'));
		}
	}
}

module.exports = Module;
