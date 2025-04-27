class Module {
	constructor() {
		this.cache = {};
	}

	clear() {
		this.cache = {};
	}

	get(url) {
		return this.cache[url];
	}
	
	set(url, json) {
		this.cache[url] = json;
	}
}

module.exports = new Module();
