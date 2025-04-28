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

		const app = express();

		app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
		app.use(bodyParser.json({ limit: '50mb' }));
		app.use(cors());

		app.get('/ok', function (request, response) {
			return response.status(200).json({ message: 'I am OK' });
		});

		app.post('/query', async (request, response) => {
			let params = Object.assign({}, request.body, request.query);
			let result = undefined;

			result = await this.mysql.query(params);
			let json = JSON.stringify(result);

			return response.status(200).json(json);
		});

		app.get('/atp/player', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);

				if (!options.id) {
					throw new Error(`Player ID is required`);
				}

				let url = `https://www.atptour.com/en/-/www/players/hero/${options.id}`;
				let response = await Gopher.fetch(url);

				if (options.parse == 'y') {
					let Parser = require('../src/parse-player.js');
					let parser = new Parser();
					response = parser.parse({ response: response, player: options.id });
				}
				return response;
			});
		});

		app.get('/atp/leaderboard', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);

				if (!options.type) {
					throw new Error(`A leaderboard type is required`);
				}

				let url = `https://www.atptour.com/en/-/www/StatsLeaderboard/${options.type}/52week/all/all/false?v=1`;
				return await Gopher.fetch(url);
			});
		});

		app.get('/atp/activity', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);

				if (!options.id) {
					throw new Error(`Player ID is required`);
				}

				let url = `https://www.atptour.com/en/-/www/activity/last/${options.id}`;
				let response = await Gopher.fetch(url);

				if (options.parse == 'y') {
					let Parser = require('../src/parse-activity.js');
					let parser = new Parser();
					response = parser.parse({ response: response, player: options.id });
				}

				return response;
			});
		});

		app.get('/atp/scores', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);
				let { parse, eventYear, eventID } = options;

				if (!eventYear) {
					throw new Error(`Event year is required`);
				}
				if (!eventID) {
					throw new Error(`Event ID is required`);
				}

				let url = `https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear=${eventYear}&eventid=${eventID}`;
				let response = await Gopher.fetch(url);

				if (parse == 'y') {
					let Parser = require('../src/parse-scores.js');
					let parser = new Parser();
					response = parser.parse({ response, eventYear, eventID });
				}

				return response;
			});
		});

		app.get('/atp/rankings', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);

				let top = options.top ? options.top : 100;
				let url = `https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=${top}`;
				let response = await Gopher.fetch(url);

				if (options.parse == 'y') {
					let Parser = require('../src/parse-rankings.js');
					let parser = new Parser();
					response = parser.parse({ response: response });
				}

				return response;
			});
		});

		app.get('/atp/live', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);

				let url = `https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour`;
				let response = await Gopher.fetch(url);

				if (options.parse == 'y') {
					let Parser = require('../src/parse-live.js');
					let parser = new Parser();
					response = parser.parse({ response: response });
				}

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
