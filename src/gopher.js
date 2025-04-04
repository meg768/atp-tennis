class Module {
	constructor() {
		this.cache = {};
	}

	clearCache() {
		this.cache = {};
	}

	async fetch(url) {
		try {
			let json = this.cache[url];

			if (!json) {
				const response = await fetch(url);

				if (!response.ok) {
					throw new Error(`Response not OK when fetching ${url}: ${response.statusText}`);
				}

				this.cache[url] = json = await response.json();
			}

			return json;
		} catch (error) {
			throw new Error(`Failed to fetch ${url}: ${error.message}`);
		}
	}
}

module.exports = new Module();
