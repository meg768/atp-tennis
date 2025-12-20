class Module {
	constructor() {}

	async pause(delay) {
		return new Promise((resolve, reject) => {
			setTimeout(() => resolve(), delay);
		});
	}

	async fetch(url, options) {
		try {
			const response = await fetch(url, options);

			const contentType = response.headers.get('content-type') || '';
			const bodyText = await response.text();

			if (!response.ok) {
				throw new Error(`Failed to fetch ${url} (${response.status})`);
			}

			// försök bara JSON om det verkar vara JSON
			if (contentType.includes('application/json')) {
				return JSON.parse(bodyText);
			}

			throw new Error(`Expected JSON but got ${contentType}`);
		} catch (error) {

            console.log({
				message: error.message,
				name: error.name,
				cause: error.cause,
				stack: error.stack
			});

			throw error;
		}
	}
}

module.exports = new Module();
