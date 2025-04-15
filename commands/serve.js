let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');
let bodyParser = require('body-parser');

let express = require('express');
let cors = require('cors');

class Module extends Command {
	constructor() {
		super({ command: 'serve [options]', description: 'Start ATP service' });
		this.mysql = new MySQL();
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
		let app = express();

		app.set('port', this.argv.port || 3004);
		app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
		app.use(bodyParser.json({ limit: '50mb' }));
		app.use(cors());

		app.get('/ok', function (request, response) {
			let now = Date.now();
			return response.status(200).json({ OK: 'I am OK' });
		});

		app.get('/query', async (request, response) => {
			return this.execute(request, response, async () => {
				let options = Object.assign({}, request.body, request.query);
				if (typeof options == 'string') {
					options = { sql: options };
				}
/*
				if (options.format) {
					try {
						options.format = JSON.parse(options.format);
					}
					catch(error) {

					}
				}
*/
				console.log(options);
				return await this.mysql.query(options);
			});
		});

		app.get('/players', async (request, response) => {
			return this.execute(request, response, async () => {
				return await this.mysql.query('SELECT * FROM players');
			});
		});

		app.listen(app.get('port'), function () {
			console.log('Node app is running on port ' + app.get('port'));
		});
	}

	async run(argv) {
		this.argv = argv;

		this.mysql.connect();

		this.listen();
	}
}

module.exports = new Module();
