let Probe = require('../src/probe.js');
let Command = require('../src/command.js');
let MarkdownProcessor = require('../src/markdown-processor.js');

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
			return response.status(401).json(result);
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

		api.get('/chat', async (request, response) => {
			const ChatATP = require('../src/chat-atp.js');
			const prompt = request.query.prompt;

			if (!prompt || typeof prompt !== 'string') {
				return response.status(400).json({ error: 'Supply a prompt as in ?prompt=...' });
			}

			try {
				this.log('Sending prompt:', prompt);
				let reply = await ChatATP.sendMessage(prompt);

				this.log(`Prompt: "${prompt}"`);
				this.log(`Reply: ${reply}`);

				let processor = new MarkdownProcessor({ mysql: this.mysql });
				let processedReply = await processor.process(reply);

				this.log(`Processed reply: ${processedReply}`);

				return response.json({
					prompt,
					reply: processedReply
				});
			} catch (error) {
				return response.status(500).json({
					prompt,
					reply: null,
					error: error.message,
					stack: error.stack?.split('\n')
				});
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
				let data = await fetcher.fetch();
				return data;
			});
		});

		app.use('/api', api);

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
