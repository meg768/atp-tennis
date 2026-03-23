let Probe = require('../src/probe.js');
let Command = require('../src/command.js');

const compression = require('compression');

class Module extends Command {
	constructor() {
		super({ command: 'serve [options]', description: 'Start ATP service' });
		this.mysql = require('../src/mysql.js');
		this.port = 3004;
		this.log = console.log;
	}

	arguments(args) {
		args.help();
	}

	async execute(request, response, fn) {
		try {
			return response.status(200).json(await fn());
		} catch (error) {
			let result = {};
			result.error = error.message;
			result.stack = error.stack.split('\n');
			return response.status(500).json(result);
		}
	}

	listen() {
		const express = require('express');

		const bodyParser = require('body-parser');
		const cors = require('cors');
		const api = express.Router();

		const app = express();

		// Compress responses > 1 KB
		app.use(compression({ threshold: 1 * 1024 }));

		app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
		app.use(bodyParser.json({ limit: '50mb' }));
		app.use(cors());

		app.get('/ok', function (request, response) {
			return response.status(200).json({ message: 'I am OK' });
		});

		api.post('/query', (req, res) => {
			this.execute(req, res, async () => {
				const params = { ...req.body, ...req.query };
				const probe = new Probe();
				const result = await this.mysql.query(params);
				this.log(`/query executed in ${probe.toString()}`);
				return result;
			});
		});

		app.get('/api/ping', (req, res) => {
			res.json({ message: 'pong' });
		});

		app.get('/api/live', async (request, response) => {
			return this.execute(request, response, async () => {
				let Fetcher = require('../src/fetch-live.js');
				let fetcher = new Fetcher();
				let raw = await fetcher.fetch();
				return await fetcher.parse(raw);
			});
		});

		app.get('/api/rankings', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);

				let Fetcher = require('../src/fetch-top-players.js');
				let fetcher = new Fetcher(options);
				let raw = await fetcher.fetch(options);
				return fetcher.parse(raw);
			});
		});

		app.get('/api/oddset', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);

				if (typeof options.states === 'string') {
					options.states = options.states
						.split(',')
						.map(value => value.trim())
						.filter(Boolean);
				}

				let Fetcher = require('../src/fetch-oddset.js');
				let fetcher = new Fetcher(options);
				let raw = await fetcher.fetch(options);

				if (options.raw != undefined && (options.raw == '' || options.raw != 0)) {
					return raw;
				}

				return fetcher.parse(raw);
			});
		});

		app.get('/api/odds/:playerA/:playerB', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query, request.params);
				let GetOdds = require('../src/get-odds.js');
				let getOdds = new GetOdds({ mysql: this.mysql });
				return await getOdds.run(options);
			});
		});

		app.get('/api/calendar', async (request, response) => {
			return this.execute(request, response, async () => {
				let Fetcher = require('../src/fetch-calendar.js');
				let fetcher = new Fetcher();
				let raw = await fetcher.fetch();
				return fetcher.parse(raw);
			});
		});
/*
		app.get('/api/atp', async (request, response) => {
			return this.execute(request, response, async () => {
				let params = Object.assign({}, request.body, request.query);

				let options = {
					headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15' }
				};

				if (!params.url) {
					throw new Error('URL parameter is required');
				}
				let Fetcher = require('../src/fetcher.js');
				let fetcher = new Fetcher();
				return await fetcher.fetchURL(params.url, options);
			});
		});
*/
		app.use('/api', api);
		/*
		app.listen(this.port, '::', () => {
			this.log(`Express running on http://localhost:${this.port}`);
		});
        */
		app.listen(this.port, '127.0.0.1', () => {
			this.log(`Express running on http://localhost:${this.port}`);
		});
	}

	async run(argv) {
		this.argv = argv;

		await this.mysql.connect();

		this.listen();
	}
}

module.exports = new Module();
