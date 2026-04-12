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

		app.get('/api/ping', (req, res) => {
			res.json({
				message: 'pong',
				version: packageJSON.version
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

		// Keep this endpoint in sync manually whenever service endpoints or payloads change.
		app.get('/api/meta/endpoints', (request, response) => {
			return response.status(200).json({
				version: packageJSON.version,
				notes: [
					'Endpoints are described as paths only.',
					'Resolve them relative to the current host where this service is running.'
				],
				endpoints: {
					'/ok': {
						method: 'GET',
						description: 'Simple health check.',
						response: {
							shape: 'object',
							example: { message: 'I am OK' }
						}
					},
					'/api/ping': {
						method: 'GET',
						description: 'Lightweight liveness payload with service version.',
						response: {
							shape: 'object',
							fields: {
								message: 'string',
								version: 'string'
							}
						}
					},
					'/api/meta/schema.sql': {
						method: 'GET',
						description: 'Returns the raw database schema SQL file, including comments and DDL.'
					},
					'/api/flags/:code.svg': {
						method: 'GET',
						params: {
							code: 'string, required, ATP-style three-letter country code such as CZE or ITA'
						},
						description: 'Returns a country flag SVG from the local flags directory. If a flag asset is missing, returns a plain white fallback SVG.',
						response: {
							shape: 'raw svg'
						}
					},
					'/api/meta/endpoints': {
						method: 'GET',
						description: 'Returns machine-readable metadata about the service endpoints.'
					},
					'/api/matches/live': {
						method: 'GET',
						description: 'Normalized ATP live matches from ATP Tour live data.'
					},
					'/api/player/rankings': {
						method: 'GET',
						query: {
							top: 'number, optional'
						},
						description: 'Current ATP rankings. Defaults to top 100.'
					},
					'/api/player/search': {
						method: 'GET',
						query: {
							term: 'string, required'
						},
						description: 'Searches player candidates through PLAYER_SEARCH.',
						response: {
							shape: 'array'
						}
					},
					'/api/player/lookup': {
						method: 'GET',
						query: {
							query: 'string, required',
							term: 'string, optional alias',
							searchTerm: 'string, optional alias'
						},
						description: 'Resolves a best-match player id through PLAYER_LOOKUP.',
						response: {
							shape: 'array',
							example: [{ id: 'RH16' }]
						}
					},
					'/api/oddset': {
						method: 'GET',
						query: {
							raw: 'boolean-like, optional'
						},
						description: 'Normalized Oddset ATP match feed. With raw=1, returns the raw upstream payload.',
						response: {
							shape: 'array',
							fields: {
								id: 'number',
								start: 'string (ISO datetime)',
								tournament: 'string',
								state: 'string',
								score: 'string|null',
								playerA: {
									id: 'string|null',
									name: 'string',
									odds: 'number|null'
								},
								playerB: {
									id: 'string|null',
									name: 'string',
									odds: 'number|null'
								}
							}
						}
					},
					'/api/oddset/odds': {
						method: 'GET',
						query: {
							playerA: 'string, required, ATP id or player name',
							playerB: 'string, required, ATP id or player name',
							requestTimeoutMs: 'number, optional',
							url: 'string, optional upstream override',
							matchesUrl: 'string, optional primary ATP matches override',
							openUrl: 'string, optional live-open fallback override',
							upcomingUrl: 'string, optional tennis-all upcoming override'
						},
						description: 'Returns Svenska Spel Oddset decimal odds for a specific matchup.',
						response: {
							shape: 'array',
							example: [1.6, 2.33],
							notes: ['Index 0 is playerA odds.', 'Index 1 is playerB odds.']
						}
					},
					'/api/odds': {
						method: 'GET',
						query: {
							playerA: 'string, required, ATP id or player name',
							playerB: 'string, required, ATP id or player name',
							surface: 'string, optional'
						},
						description: 'Returns model prices for a specific matchup.',
						response: {
							shape: 'array',
							example: [1.63, 2.29],
							notes: ['Index 0 is playerA odds.', 'Index 1 is playerB odds.']
						}
					},
					'/api/tennis-abstract/odds': {
						method: 'GET',
						query: {
							playerA: 'string, required, ATP id or player name',
							playerB: 'string, required, ATP id or player name',
							surface: 'string, optional, Hard/Clay/Grass',
							bestOf: 'number, optional, defaults to 3'
						},
						description: 'Returns Tennis Abstract-inspired matchup odds with a 5% margin added to the model probabilities.',
						response: {
							shape: 'array',
							example: [1.68, 2.24],
							notes: ['Index 0 is playerA odds.', 'Index 1 is playerB odds.']
						}
					},
					'/api/events/calendar': {
						method: 'GET',
						description: 'Normalized ATP calendar.',
						response: {
							shape: 'object',
							fields: {
								events: 'array'
							}
						}
					},
					'/api/query': {
						method: 'POST',
						body: {
							sql: 'string, required, read-only SQL only'
						},
						description: 'Runs read-only SQL against the ATP database.',
						response: {
							shape: 'array'
						}
					}
				}
			});
		});

		app.get('/api/matches/live', async (request, response) => {
			return this.execute(request, response, async () => {
				let Fetcher = require('../src/fetch-live.js');
				let fetcher = new Fetcher();
				let raw = await fetcher.fetch();
				return await fetcher.parse(raw);
			});
		});

		app.get('/api/player/rankings', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);

				let Fetcher = require('../src/fetch-top-players.js');
				let fetcher = new Fetcher(options);
				let raw = await fetcher.fetch(options);
				return fetcher.parse(raw);
			});
		});

		app.get('/api/player/search', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);
				let term = String(options.term ?? '').trim();

				if (!term) {
					return [];
				}

				return await this.mysql.query({
					sql: 'CALL PLAYER_SEARCH(?)',
					format: [term]
				});
			});
		});

		app.get('/api/player/lookup', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);
				let query = String(options.searchTerm ?? options.query ?? options.term ?? '').trim();

				if (!query) {
					return [];
				}

				return await this.mysql.query({
					sql: 'SELECT PLAYER_LOOKUP(?) AS id',
					format: [query]
				});
			});
		});

		app.get('/api/oddset', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);

				let Fetcher = require('../src/fetch-oddset.js');
				let fetcher = new Fetcher({ ...options, mysql: this.mysql, log: this.log });
				let raw = await fetcher.fetch(options);

				if (options.raw != undefined && (options.raw == '' || options.raw != 0)) {
					return raw;
				}

				return fetcher.parse(raw);
			});
		});

		app.get('/api/oddset/odds', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query, request.params);
				let FetchOddsetOdds = require('../src/fetch-oddset-odds.js');
				let fetchOddsetOdds = new FetchOddsetOdds({ mysql: this.mysql, log: this.log });
				let raw = await fetchOddsetOdds.fetch(options);
				return fetchOddsetOdds.parse(raw);
			});
		});

		app.get('/api/odds', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query, request.params);
				let playerA = String(options.playerA || '').trim();
				let playerB = String(options.playerB || '').trim();
				let surface = options.surface == null ? null : String(options.surface).trim();

				if (!playerA || !playerB) {
					throw new Error('playerA and playerB parameters are required.');
				}

				if (playerA.toUpperCase() === playerB.toUpperCase()) {
					throw new Error('playerA and playerB must be different.');
				}

				let rows = await this.mysql.query({
					sql: 'CALL PLAYER_ODDS(?, ?, ?)',
					format: [playerA, playerB, surface || null]
				});

				rows = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows;

				if (!Array.isArray(rows) || rows.length !== 2) {
					throw new Error('Could not calculate odds.');
				}

				return rows.map(row => row.odds);
			});
		});

		app.get('/api/tennis-abstract/odds', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query, request.params);
				let FetchTennisAbstractOdds = require('../src/fetch-tennis-abstract-odds.js');
				let fetchTennisAbstractOdds = new FetchTennisAbstractOdds({ mysql: this.mysql, log: this.log });
				let raw = await fetchTennisAbstractOdds.fetch(options);
				return fetchTennisAbstractOdds.parse(raw);
			});
		});

		app.get('/api/events/calendar', async (request, response) => {
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
