let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');
let bodyParser = require('body-parser');
let Gopher = require('../src/gopher.js');
let axios = require('axios');

let isString = require('yow/isString');
let isArray = require('yow/isArray');

let express = require('express');
let cors = require('cors');

class Module extends Command {
	constructor() {
		super({
			command: 'serve [options]',
			description: 'Start ATP service'
		});
		this.mysql = new MySQL();
		this.port = 3004;
	}

	arguments(args) {
		args.help();
	}

	async query(connection, params) {
		let promise = new Promise((resolve, reject) => {
			try {
				if (isString(params)) {
					params = { sql: params };
				}

				let { format, sql, ...options } = params;

				if (format) {
					sql = connection.format(sql, format);
				}

				connection.query({ sql: sql, ...options }, (error, results) => {
					if (error) {
						reject(error);
					} else resolve(results);
				});
			} catch (error) {
				reject(error);
			}
		});

		return await promise;
	}

	async execute(request, response, fn) {
		try {
			return response.status(200).json(await fn());
		} catch (error) {
			let result = {};
			result.error = error.message;
			result.stack = error.stack.split('\n');
			return response.status(401).json(result);
		}
	}

	toJSON(x) {
		try {
			if (typeof x == 'object') {
				return x;
			}
			return JSON.parse(x);
		} catch (error) {
			return undefined;
		}
	}

	listen() {
		const express = require('express');
		const bodyParser = require('body-parser');
		const cors = require('cors');
		const path = require('path');

		const app = express();

		app.use(
			bodyParser.urlencoded({
				limit: '50mb',
				extended: false
			})
		);
		app.use(bodyParser.json({ limit: '50mb' }));
		app.use(cors());

		app.get('/ok', function (request, response) {
			return response.status(200).json({ message: 'I am OK' });
		});

		app.post('/query', async (request, response) => {
			return this.execute(request, response, async () => {
				let params = Object.assign({}, request.body, request.query);

				console.log(params);
				return await this.mysql.query(params);
			});
		});

		app.get('/atp/live', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);

				let Fetcher = require('../src/fetch-live.js');
				let fetcher = new Fetcher();
				let response = await fetcher.fetch();
				return response;
			});
		});

		app.listen(this.port, () => {
			console.log('Node app is running on port ' + this.port);
		});
	}

	async run(argv) {
		this.argv = argv;

		this.mysql.connect();

		this.listen();
	}
}

module.exports = new Module();
