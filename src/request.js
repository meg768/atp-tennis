class Request {
	constructor(options) {
		this.url = 'https://app.atptour.com';
		this.headers = { 'content-type': 'application/json' };
		this.options = options;
	}

	async request(options) {
		try {
			let axios = require('axios');
			let response = await axios(options);

			console.log(response.data);
			return response.data;
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
