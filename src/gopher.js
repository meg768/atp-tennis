class Module {
	constructor() {
		this.cache = {};
		this.delay = 0;
	}

	clearCache() {
		this.cache = {};
	}

	setDelay(ms) {
		this.delay = ms;
	}

	async pause() {
		if (this.delay > 0) {
			console.log('DELAYING');
			return new Promise((resolve, reject) => {
				setTimeout(() => resolve(), this.delay);
			});
		}
	}

	async fetch(url) {
		try {
			await this.pause();

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
