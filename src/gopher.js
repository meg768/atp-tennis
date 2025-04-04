class Module {
	constructor() {
		this.cache = {};
	}

	clearCache() {
		this.cache = {};
	}

	async fetch(url) {
		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Response not OK when fetching ${url}: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			throw new Error(`Failed to fetch ${url}: ${error.message}`);
		}
	}

	async fetchX(url) {
		try {
			let json = this.cache[url];

			if (!json) {
				const response = await fetch(url);

				if (!response.ok) {
					throw new Error(`Response not OK when fetching ${url}: ${response.statusText}`);
				}

				json = await response.json();
				//this.cache[url] = json
			}

			return json;
		} catch (error) {
			throw new Error(`Failed to fetch ${url}: ${error.message}`);
		}
	}
}

module.exports = new Module();
