
class Module {
	constructor(options) {
		this.log = options?.log || console.log;
	}


	input(fileName) {
		if (typeof fileName === 'string') {
			const fs = require('fs');
			return JSON.parse(fs.readFileSync(fileName, 'utf8'));
		}
		return null;
	}

	output({ fileName, json }) {
		if (typeof fileName === 'string' && json) {
			const fs = require('fs');
			fs.writeFileSync(fileName, JSON.stringify(json, null, '\t'));
		}
	}
}

module.exports = Module;
