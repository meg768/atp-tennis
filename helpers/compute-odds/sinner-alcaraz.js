#!/usr/bin/env node

const http = require('http');

const PLAYER_A_ID = 'S0AG';
const PLAYER_B_ID = 'A0E2';
const DEFAULT_PORT = 3004;

function isHelpFlag(value) {
	return ['-h', '--help', 'help'].includes(String(value || '').toLowerCase());
}

function printUsage() {
	console.log('Usage: ./helpers/compute-odds/sinner-alcaraz.js [--hard|--clay|--grass] [--port=3004]');
	console.log('Calls the local /api/odds endpoint for Sinner vs Alcaraz.');
	console.log('The ATP service must already be running.');
}

function getSurface(args) {
	const options = {
		'--hard': 'Hard',
		'--clay': 'Clay',
		'--grass': 'Grass'
	};

	const selected = args.filter(arg => Object.prototype.hasOwnProperty.call(options, arg));

	if (selected.length > 1) {
		throw new Error('Choose only one of --hard, --clay or --grass.');
	}

	return selected.length === 1 ? options[selected[0]] : null;
}

function getPort(args) {
	const option = args.find(arg => arg.startsWith('--port='));

	if (!option) {
		return DEFAULT_PORT;
	}

	const value = Number(option.split('=')[1]);

	if (!Number.isInteger(value) || value <= 0) {
		throw new Error('port must be a positive integer.');
	}

	return value;
}

function getJson(url) {
	return new Promise((resolve, reject) => {
		const request = http.get(url, response => {
			let body = '';

			response.setEncoding('utf8');
			response.on('data', chunk => {
				body += chunk;
			});
			response.on('end', () => {
				try {
					const json = JSON.parse(body || '{}');

					if (response.statusCode >= 400) {
						const message = json.error || `Request failed with status ${response.statusCode}.`;
						return reject(new Error(message));
					}

					resolve(json);
				} catch (error) {
					reject(error);
				}
			});
		});

		request.on('error', error => {
			reject(error);
		});
	});
}

async function main() {
	const args = process.argv.slice(2);

	if (args.some(isHelpFlag)) {
		printUsage();
		return;
	}

	const surface = getSurface(args);
	const port = getPort(args);
	const params = new URLSearchParams();

	params.set('playerA', PLAYER_A_ID);
	params.set('playerB', PLAYER_B_ID);

	if (surface) {
		params.set('surface', surface);
	}

	const query = params.toString();
	const url = `http://127.0.0.1:${port}/api/odds?${query}`;
	const result = await getJson(url);

	console.log(`GET ${url}`);
	console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
	main().catch(error => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
