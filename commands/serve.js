let Probe = require('../src/probe.js');
let Command = require('../src/command.js');
let assertReadOnlySQL = require('../src/assert-read-only-sql.js');
let packageJSON = require('../package.json');
const path = require('path');
const fs = require('fs');

const compression = require('compression');

const MISSING_FLAG_SVG = [
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 57" width="85" height="57">',
	'<rect width="85" height="57" rx="0" fill="#FFFFFF"/>',
	'</svg>'
].join('');

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
			const params = { ...req.body, ...req.query };

			try {
				assertReadOnlySQL(params.sql);
			} catch (error) {
				return res.status(400).json({ error: error.message });
			}

			this.execute(req, res, async () => {
				const probe = new Probe();
				const result = await this.mysql.query(params);
				this.log(`/query executed in ${probe.toString()}`);
				return result;
			});
		});

		app.get('/api/ping', async (request, response) => {
			return this.execute(request, response, async () => {
				let ApiPing = require('../src/api-ping.js');
				let apiPing = new ApiPing({ version: packageJSON.version });
				let raw = await apiPing.fetch();
				return apiPing.parse(raw);
			});
		});

		app.get('/api/meta/schema.sql', (request, response) => {
			response.type('application/sql');
			response.setHeader('Content-Disposition', 'inline; filename="schema.sql"');
			return response.sendFile(path.resolve(__dirname, '../database/schema.sql'));
		});

		app.get('/api/flags/:code.svg', (request, response) => {
			let code = String(request.params.code || '')
				.trim()
				.replace(/[^a-z]/gi, '')
				.toUpperCase();

			if (!code) {
				return response.status(400).json({ error: 'Flag code is required.' });
			}

			let flagPath = path.resolve(__dirname, `../flags/${code}.svg`);

			if (!fs.existsSync(flagPath)) {
				response.type('image/svg+xml');
				response.setHeader('Content-Disposition', `inline; filename="${code}.svg"`);
				response.setHeader('Cache-Control', 'public, max-age=3600');
				return response.status(200).send(MISSING_FLAG_SVG);
			}

			response.type('image/svg+xml');
			response.setHeader('Content-Disposition', `inline; filename="${code}.svg"`);
			response.setHeader('Cache-Control', 'public, max-age=86400');
			return response.sendFile(flagPath);
		});

		app.get('/api/meta/endpoints', async (request, response) => {
			return this.execute(request, response, async () => {
				let ApiMetaEndpoints = require('../src/api-meta-endpoints.js');
				let apiMetaEndpoints = new ApiMetaEndpoints({ version: packageJSON.version });
				let raw = await apiMetaEndpoints.fetch();
				return apiMetaEndpoints.parse(raw);
			});
		});

		app.get('/api/matches/live', async (request, response) => {
			return this.execute(request, response, async () => {
				let ApiMatchesLive = require('../src/api-matches-live.js');
				let apiMatchesLive = new ApiMatchesLive();
				let raw = await apiMatchesLive.fetch();
				return await apiMatchesLive.parse(raw);
			});
		});

		app.get('/api/player/rankings', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);

				let ApiPlayerRankings = require('../src/api-player-rankings.js');
				let apiPlayerRankings = new ApiPlayerRankings(options);
				let raw = await apiPlayerRankings.fetch(options);
				return apiPlayerRankings.parse(raw);
			});
		});

		app.get('/api/player/search', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);
				let ApiPlayerSearch = require('../src/api-player-search.js');
				let apiPlayerSearch = new ApiPlayerSearch({ mysql: this.mysql });
				let raw = await apiPlayerSearch.fetch(options);
				return apiPlayerSearch.parse(raw);
			});
		});

		app.get('/api/player/lookup', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);
				let ApiPlayerLookup = require('../src/api-player-lookup.js');
				let apiPlayerLookup = new ApiPlayerLookup({ mysql: this.mysql });
				let raw = await apiPlayerLookup.fetch(options);
				return apiPlayerLookup.parse(raw);
			});
		});

		app.get('/api/oddset', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);

				let ApiOddset = require('../src/api-oddset.js');
				let apiOddset = new ApiOddset({ ...options, mysql: this.mysql, log: this.log });
				let raw = await apiOddset.fetch(options);

				if (options.raw != undefined && (options.raw == '' || options.raw != 0)) {
					return raw;
				}

				return apiOddset.parse(raw);
			});
		});

		app.get('/api/oddset/odds', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query, request.params);
				let ApiOddsetOdds = require('../src/api-oddset-odds.js');
				let apiOddsetOdds = new ApiOddsetOdds({ mysql: this.mysql, log: this.log });
				let raw = await apiOddsetOdds.fetch(options);
				return apiOddsetOdds.parse(raw);
			});
		});

		app.get('/api/odds', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query, request.params);
				let ApiOdds = require('../src/api-odds.js');
				let apiOdds = new ApiOdds({ mysql: this.mysql });
				let raw = await apiOdds.fetch(options);
				return apiOdds.parse(raw);
			});
		});

		app.get('/api/tennis-abstract/odds', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query, request.params);
				let ApiTennisAbstractOdds = require('../src/api-tennis-abstract-odds.js');
				let apiTennisAbstractOdds = new ApiTennisAbstractOdds({ mysql: this.mysql, log: this.log });
				let raw = await apiTennisAbstractOdds.fetch(options);
				return apiTennisAbstractOdds.parse(raw);
			});
		});

		app.get('/api/events/calendar', async (request, response) => {
			return this.execute(request, response, async () => {
				let ApiEventsCalendar = require('../src/api-events-calendar.js');
				let apiEventsCalendar = new ApiEventsCalendar();
				let raw = await apiEventsCalendar.fetch();
				return apiEventsCalendar.parse(raw);
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
