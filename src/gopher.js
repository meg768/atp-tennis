class Module {
	constructor() {
		this.cache = {};
		this.delay = 0;
	}

	async pause() {
		if (this.delay > 0) {
			return new Promise((resolve, reject) => {
				setTimeout(() => resolve(), this.delay);
			});
		}
	}

	async fetch(url) {
		for (let tryCount = 0; tryCount < 3; tryCount++) {
			try {
				const response = await fetch(url);

				if (!response.ok) {
					throw new Error(`Fetch failed`);					
				}

				return await response.json();
			} catch (error) {
				await this.pause(30000);
				continue;
			}
		}

		throw new Error(`Failed to fetch ${url}`);
	}
}

module.exports = new Module();
