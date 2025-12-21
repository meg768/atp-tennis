class Gopher {
	constructor() {}

	async pause(delay) {
		return new Promise((resolve, reject) => {
			setTimeout(() => resolve(), delay);
		});
	}

	async fetch(url, options) {
		try {
			const defaultHeaders = {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
				'Accept': 'application/json, text/plain, */*'
			};

			options = {
				...options,
				headers: {
					...defaultHeaders,
					...(options?.headers || {})
				}
			};

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

module.exports = new Gopher();
