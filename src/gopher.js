class Module {
	constructor() {}

	async pause(delay) {
		return new Promise((resolve, reject) => {
			setTimeout(() => resolve(), delay);
		});
	}

	async fetch(url, options) {
        console.log('Fetching URL:', url, options);
		const response = await fetch(url, options);

		const contentType = response.headers.get('content-type') || '';
		const bodyText = await response.text();

//		console.log('STATUS:', response.status);
//		console.log('CONTENT-TYPE:', contentType);
//		console.log('BODY (first 500):', bodyText.slice(0, 500));

		if (!response.ok) {
			throw new Error(`Failed to fetch ${url} (${response.status})`);
		}

		// försök bara JSON om det verkar vara JSON
		if (contentType.includes('application/json')) {
			return JSON.parse(bodyText);
		}

		throw new Error(`Expected JSON but got ${contentType}`);
	}
}

module.exports = new Module();
