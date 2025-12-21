class Gopher {
	constructor() {}

	async fetch(url, options) {
		let retryCount = options?.retryCount || 3;
		let retryDelay = options?.retryDelay || 30000;

		const defaultHeaders = {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
			'Accept': 'application/json'
		};

		options = {
			...options,
			headers: {
				...defaultHeaders,
				...(options?.headers || {})
			}
		};

		async function pause(delay) {
			return new Promise((resolve, reject) => {
				setTimeout(() => resolve(), delay);
			});
		}

		async function fetchOnce() {
			const response = await fetch(url, options);

			if (!response.ok) {
				throw new Error(`Failed to fetch ${url} (${response.status})`);
			}

			const contentType = response.headers.get('content-type') || '';
			const bodyText = await response.text();

			// Försök bara JSON om det verkar vara JSON
			if (contentType.includes('application/json')) {
				return JSON.parse(bodyText);
			}

			throw new Error(`Expected JSON but got ${contentType}`);
		}

		for (let attempt = 1; attempt <= retryCount; attempt++) {
			try {
				return await fetchOnce();
			} catch (error) {
				console.log(error.message);
				await pause(retryDelay);
			}
		}

		throw new Error(`Failed to fetch ${url} after ${retryCount} attempts`);
	}
}

module.exports = new Gopher();
