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
				let Api = require('../src/api-ping.js');
				let api = new Api({ request, response, version: packageJSON.version, log: this.log });
				return await api.run();
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
				let Api = require('../src/api-meta-endpoints.js');
				let api = new Api({ request, response, version: packageJSON.version, log: this.log });
				return await api.run();
			});
		});

		app.get('/api/matches/live', async (request, response) => {
			return this.execute(request, response, async () => {
				let Api = require('../src/api-matches-live.js');
				let api = new Api({ request, response, log: this.log });
				return await api.run();
			});
		});

		app.get('/api/player/rankings', async (request, response) => {
			return this.execute(request, response, async () => {
				let Api = require('../src/api-player-rankings.js');
				let api = new Api({ request, response, log: this.log });
				return await api.run();
			});
		});

		app.get('/api/player/search', async (request, response) => {
			return this.execute(request, response, async () => {
				let Api = require('../src/api-player-search.js');
				let api = new Api({ request, response, mysql: this.mysql, log: this.log });
				return await api.run();
			});
		});

		app.get('/api/player/lookup', async (request, response) => {
			return this.execute(request, response, async () => {
				let Api = require('../src/api-player-lookup.js');
				let api = new Api({ request, response, mysql: this.mysql, log: this.log });
				return await api.run();
			});
		});

		app.get('/api/oddset', async (request, response) => {
			return this.execute(request, response, async () => {
				let Api = require('../src/api-oddset.js');
				let api = new Api({ request, response, mysql: this.mysql, log: this.log });
				return await api.run();
			});
		});

		app.get('/api/odds', async (request, response) => {
			return this.execute(request, response, async () => {
				let Api = require('../src/api-odds.js');
				let api = new Api({ request, response, mysql: this.mysql, log: this.log });
				return await api.run();
			});
		});

		app.get('/api/events/calendar', async (request, response) => {
			return this.execute(request, response, async () => {
				let Api = require('../src/api-events-calendar.js');
				let api = new Api({ request, response, log: this.log });
				return await api.run();
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
