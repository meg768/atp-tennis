let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');
let bodyParser = require('body-parser');

let isString = require('yow/isString');
let isArray = require('yow/isArray');

let express = require('express');
let cors = require('cors');

const compression = require('compression');

const gptPrompt = `
Du är en SQL-expert. Databasen innehåller följande tabeller:

players(id, name, country)
matches(id, event, round, winner, loser, score)
events(id, date, name, location, type, surface)

Relationer:
- matches.winner och matches.loser refererar till players.id
- matches.event refererar till events.id
- players.country är en landskod, t.ex. 'USA', 'GBR'
- matches.round är ett värde som: 'F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128'
- events.surface är ett av: 'Grass', 'Hard', 'Clay', 'Carpet'
- events.type är ett av: 'Grand Slam', 'Masters', 'ATP-500', 'ATP-250', 'Rod Laver Cup', 'Davis Cup', 'Olympics'

Regler:
- Endast SELECT-satser.
- Vid sökning på spelarnamn, använd players.name med LIKE '%namn%'
- Om något är oklart eller inte går att besvara korrekt, returnera en korrekt MySQL-sats av typen:
  SELECT 'förklaring här' AS \`Meddelande\`; Ingenting annat.
- Använd svensk namngivning för genererade kolumner.
`;

class Module extends Command {
	constructor() {
		super({ command: 'serve [options]', description: 'Start ATP service' });
		this.mysql = new MySQL();
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
			return response.status(401).json(result);
		}
	}

	async generateSQLFromNaturalLanguage(question) {
		const { OpenAI } = require('openai');

		const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
		const prompt = `${gptPrompt}\nSkriv en MySQL-sats som svarar på: "${question}"`;

		const response = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0
		});

		let sql = response.choices[0].message.content.trim();

		return sql;
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

		api.post('/ask', async (req, res) => {
			const { question } = req.body;

			if (!question || typeof question !== 'string') {
				return res.status(400).json({ error: 'Du måste skicka med en fråga i textform.' });
			}

			try {
				// Här anropar du GPT för att få SQL från svensk fråga
				const sql = await this.generateSQLFromNaturalLanguage(question);

				this.log(`Fråga: "${question}"`);
				this.log(`SQL: ${sql}`);

				// Kör den genererade SQL-satsen
				const result = await this.mysql.query({ sql });

				res.json(result);
			} catch (error) {
				let result = {};
				result.error = error.message;
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
