class Module {
	constructor() {}

	async pause(delay) {
		return new Promise((resolve, reject) => {
			setTimeout(() => resolve(), delay);
		});
	}

	async fetch(url) {
		for (let tryCount = 0; tryCount < 3; tryCount++) {
			try {
				const response = await fetch(url);

				throw new Error('XXX');
				if (!response.ok) {
					throw new Error(`Failed to fetch ${url}`);
				}

				return await response.json();
			} catch (error) {
				console.log(error.message);
				console.log('Retrying...');
				await this.pause(1000);
				continue;
			}
		}

		throw new Error(`Failed to fetch ${url}`);
	}
}

module.exports = new Module();
