class Module {
	constructor() {}

	async pause(delay) {
		return new Promise((resolve, reject) => {
			setTimeout(() => resolve(), delay);
		});
	}

	async fetch(url, options) {
		try {
			console.log('Fetching URL:', url, options);
			const response = await fetch(url, options);

			const contentType = response.headers.get('content-type') || '';
			const bodyText = await response.text();

			console.log('STATUS:', response.status);
			console.log('CONTENT-TYPE:', contentType);
			console.log('BODY (first 500):', bodyText.slice(0, 500));

			if (!response.ok) {
				throw new Error(`Failed to fetch ${url} (${response.status})`);
			}

			// försök bara JSON om det verkar vara JSON
			if (contentType.includes('application/json')) {
				return JSON.parse(bodyText);
			}

			throw new Error(`Expected JSON but got ${contentType}`);
		} catch (error) {
			console.error('Error fetching URL:', error);
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
