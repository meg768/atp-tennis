class Request {
	constructor(options) {
		this.url = 'https://app.atptour.com';
		this.headers = { 'content-type': 'application/json' };
		this.options = options;
	}

	async request(options) {
		try {
			let url = new URL(options.url);

			if (options.params) {
				for (let [key, value] of Object.entries(options.params)) {
					url.searchParams.set(key, value);
				}
			}

			let response = await fetch(url, {
				method: options.method || 'GET',
				headers: options.headers
			});

			if (!response.ok) {
				throw new Error(`Request failed with status ${response.status}`);
			}

			let data = await response.json();
			console.log(data);
			return data;
		} catch (error) {
			throw new Error(error.message);
		}
	}

	async get({ path, params }) {
		let options = {
			method: 'get',
			url: `${this.url}/${path}`,
			params: params,
			headers: this.headers
		};

		return await this.request(options);
	}
}

module.exports = Request;
