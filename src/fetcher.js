const Gopher = require('./gopher');

class Module {
	constructor(options) {
		this.log = options?.log || console.log;
	}

	async fetchATP(url, options) {

        if (!process.env.ATP_SERVICE) {
            throw new Error('ATP_SERVICE environment variable is not set');
        }   
        
		url = `${process.env.ATP_SERVICE}/api/atp?url=${encodeURIComponent(url)}`;
        return await this.fetchURL(url, options);
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

module.exports = Module;
