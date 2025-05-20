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
		super({ command: 'serve [options]', description: 'Start ATP service' });
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
		const api = express.Router();


		const app = express();

		app.use((req, res, next) => {
			console.log('INCOMING:', req.method, req.url);
			next();
		});

		app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
		app.use(bodyParser.json({ limit: '50mb' }));
		app.use(cors());

		app.get('/ok', function (request, response) {
			return response.status(200).json({ message: 'I am OK' });
		});

		app.use((req, res, next) => {
			console.log('UNHANDLED:', req.method, req.url);
			next();
		});

		api.post('/query', async (req, res) => {
			console.log('HANDLED: POST /api/query');
			const params = { ...req.body, ...req.query };

			try {
				const result = await this.mysql.query(params);
				res.status(200).json(result);
			} catch (error) {
				res.status(500).json({ message: error.message });
			}
		});

		app.get('/api/ping', (req, res) => {
			res.json({ message: 'pong' });
		});

		app.get('/api/live', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);

				let Fetcher = require('../src/fetch-live.js');
				let fetcher = new Fetcher();
				let response = await fetcher.fetch();
				return response;
			});
		});

		app.use('/api', api);

		app.listen(3004, '127.0.0.1', () => {
			console.log('Express running on http://localhost:3004');
		});
	}

	async run(argv) {
		this.argv = argv;

		this.mysql.connect();

		this.listen();
	}
}

module.exports = new Module();
