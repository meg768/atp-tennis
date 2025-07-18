let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let ChatATP = require('../src/chat-atp.js');
let Command = require('../src/command.js');
let bodyParser = require('body-parser');

let express = require('express');
let cors = require('cors');

const compression = require('compression');

class Module extends Command {
	constructor() {
		super({ command: 'serve [options]', description: 'Start ATP service' });
		this.mysql = new MySQL();
		this.port = 3004;
		this.log = console.log;
		this.chatATP = new ChatATP();
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
			return response.status(401).json(result);
		}
	}

	listen() {
		const express = require('express');

		const bodyParser = require('body-parser');
		const cors = require('cors');
		const path = require('path');
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

		api.get('/ask', async (req, res) => {
			const question = req.query.question;

			if (!question || typeof question !== 'string') {
				return res.status(400).json({ error: 'Supply a query as in ?question=...' });
			}

			let sql;
			try {
				sql = await this.chatATP.sendMessage(question);
				sql = sql.replace(/\s+/g, ' ').trim();

				this.log(`Fråga: "${question}"`);
				this.log(`SQL: ${sql}`);

				if (!/^SELECT\s/i.test(sql.trim())) {
					return res.status(400).json({ error: sql });
				}

				const result = await this.mysql.query({ sql });

				if (result?.length === 1 && result[0]?.Meddelande) {
					return res.status(400).json({ message: result[0].Meddelande });
				}

				return res.json({
					question,
					sql,
					answer: result,
					timestamp: new Date().toISOString()
				});
			} catch (error) {
				return res.status(500).json({
					error: error.message,
					sql: sql || null,
					stack: error.stack?.split('\n')
				});
			}
		});

		api.get('/chat', async (request, response) => {
			const prompt = request.query.prompt;

			if (!prompt || typeof prompt !== 'string') {
				return response.status(400).json({ error: 'Supply a prompt as in ?prompt=...' });
			}

			let reply;

			try {
				reply = await this.chatATP.sendMessage(prompt);

				this.log(`Prompt: "${prompt}"`);
				this.log(`Reply: ${reply}`);

				return response.json({
					prompt,
					reply
				});
			} catch (error) {
				return response.status(500).json({
					prompt: prompt,
					reply: null,
					error: error.message,
					stack: error.stack?.split('\n')
				});
			}
		});

		api.post('/ask', async (request, response) => {
			const { question } = request.body;

			if (!question || typeof question !== 'string') {
				return response.status(400).json({ error: 'Du måste skicka med en fråga i textform.' });
			}
			// Här anropar du GPT för att få SQL från svensk fråga
			let sql = await this.chatATP.sendMessage(question);

			try {
				this.log(`Fråga: "${question}"`);
				this.log(`SQL: ${sql}`);

				// Om SQL-satsen inte börjar med SELECT, returnera ett vad vi fick tillbaka som ett fel
				if (!sql.trim().toUpperCase().startsWith('SELECT')) {
					return response.status(400).json({
						error: sql
					});
				}

				// Kör den genererade SQL-satsen
				const result = await this.mysql.query({ sql });

				if (result && result.length == 1 && result[0].hasOwnProperty('!')) {
					// Om resultatet är en förklaring, returnera det som ett fel
					return response.status(400).json({
						error: result[0]['!']
					});
				}

				response.json({ question: question, sql: sql, answer: result });
			} catch (error) {
				let result = {};
				result.error = error.message;
				result.sql = sql;
				result.stack = error.stack.split('\n');
				return response.status(401).json(result);
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
