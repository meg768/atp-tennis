#!/usr/bin/env node

const http = require('http');
const path = require('path');

require('dotenv').config({
	path: path.resolve(__dirname, '..', '..', '.env')
});

const mysql = require('../../src/mysql.js');
const DEFAULT_PORT = 3004;

function printUsage() {
	console.log('Usage: ./helpers/compute-odds/run.js [--hard|--clay|--grass] [--port=3004] [playerA] [playerB]');
	console.log('Example: ./helpers/compute-odds/run.js "Jannik Sinner" Alcaraz');
	console.log('Example: ./helpers/compute-odds/run.js --clay "Jannik Sinner" Alcaraz');
	console.log('You can use ATP player ids or player names.');
	console.log('The ATP service must already be running.');
}

function isHelpFlag(value) {
	return ['-h', '--help', 'help'].includes(String(value || '').toLowerCase());
}

function formatRank(value) {
	return Number.isFinite(Number(value)) ? `#${Number(value)}` : '-';
}

function formatElo(value) {
	return Number.isFinite(Number(value)) ? Number(value).toFixed(1) : '-';
}

function formatOdds(value) {
	return Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value).toFixed(2) : '-';
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

function getSurfaceOptions(args) {
	const options = {
		'--hard': { surface: 'Hard', field: 'elo_rank_hard' },
		'--clay': { surface: 'Clay', field: 'elo_rank_clay' },
		'--grass': { surface: 'Grass', field: 'elo_rank_grass' }
	};

	const selected = args.filter(arg => Object.prototype.hasOwnProperty.call(options, arg));

	if (selected.length > 1) {
		throw new Error('Choose only one of --hard, --clay or --grass.');
	}

	return selected.length === 1 ? options[selected[0]] : { surface: null, field: 'elo_rank' };
}

async function findPlayers(term) {
	const normalized = String(term || '').trim();

	if (!normalized) {
		return [];
	}

	return await mysql.query({
		sql: `
			SELECT
				id,
				name,
				country,
				rank,
				elo_rank,
				elo_rank_hard,
				elo_rank_clay,
				elo_rank_grass,
				active,
				CASE
					WHEN UPPER(id) = UPPER(?) THEN 1
					WHEN LOWER(name) = LOWER(?) THEN 2
					WHEN LOWER(name) LIKE LOWER(?) THEN 3
					WHEN LOWER(name) LIKE LOWER(?) THEN 4
					ELSE 5
				END AS match_score
			FROM players
			WHERE
				UPPER(id) = UPPER(?)
				OR LOWER(name) = LOWER(?)
				OR LOWER(name) LIKE LOWER(?)
				OR LOWER(name) LIKE LOWER(?)
			ORDER BY
				match_score ASC,
				(active = 1) DESC,
				(rank IS NULL) ASC,
				rank ASC,
				(elo_rank IS NULL) ASC,
				elo_rank DESC,
				name ASC
			LIMIT 5
		`,
		format: [normalized, normalized, `${normalized}%`, `%${normalized}%`, normalized, normalized, `${normalized}%`, `%${normalized}%`]
	});
}

function printCandidates(label, search, rows) {
	console.error(`Could not match ${label}: "${search}"`);

	if (!Array.isArray(rows) || rows.length === 0) {
		console.error('No matching players found in the database.');
		return;
	}

	console.error('Candidates:');

	for (const row of rows) {
		console.error(`- ${row.name} (${row.id}) rank ${formatRank(row.rank)} ELO ${formatElo(row.elo_rank)}`);
	}
}

function logMatch(label, search, player, rows) {
	const next = rows[1];
	const ambiguous = next && Number(next.match_score) === Number(player.match_score);
	const suffix = ambiguous ? ' (best guess)' : '';
	console.log(`${label}: "${search}" -> ${player.name} (${player.id})${suffix}`);
}

async function resolvePlayer(label, search) {
	const rows = await findPlayers(search);

	if (rows.length === 0) {
		printCandidates(label, search, rows);
		process.exitCode = 1;
		return null;
	}

	const player = rows[0];
	logMatch(label, search, player, rows);
	return player;
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
					const json = JSON.parse(body || 'null');

					if (response.statusCode >= 400) {
						const message = json?.error || `Request failed with status ${response.statusCode}.`;
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
		process.exitCode = 0;
		return;
	}

	const surface = getSurfaceOptions(args);
	const port = getPort(args);
	const terms = args.filter(arg => !arg.startsWith('--'));

	if (terms.length < 2) {
		printUsage();
		process.exitCode = 1;
		return;
	}

	const searchA = terms[0];
	const searchB = terms[1];

	await mysql.connect();

	try {
		const playerA = await resolvePlayer('playerA', searchA);
		const playerB = await resolvePlayer('playerB', searchB);

		if (!playerA || !playerB) {
			return;
		}

		if (String(playerA.id).toUpperCase() === String(playerB.id).toUpperCase()) {
			throw new Error('Choose two different players.');
		}

		const params = new URLSearchParams();

		params.set('playerA', String(playerA.id));
		params.set('playerB', String(playerB.id));

		if (surface.surface) {
			params.set('surface', surface.surface);
		}

		const query = params.toString();
		const url = `http://127.0.0.1:${port}/api/odds?${query}`;
		const result = await getJson(url);

		if (!Array.isArray(result) || result.length < 2) {
			throw new Error('Expected odds endpoint to return [oddsA, oddsB].');
		}

		const [oddsA, oddsB] = result;

		console.log('');
		console.log(`${playerA.name} vs ${playerB.name}`);
		console.log(`Surface: ${surface.surface || 'All'}`);
		console.log(`Rank: ${formatRank(playerA.rank)} - ${formatRank(playerB.rank)}`);
		console.log(`ELO: ${formatElo(playerA[surface.field])} - ${formatElo(playerB[surface.field])}`);
		console.log(`Odds: ${playerA.name} ${formatOdds(oddsA)} - ${formatOdds(oddsB)} ${playerB.name}`);
		console.log(`Endpoint: ${url}`);
	} finally {
		await mysql.disconnect();
	}
}

if (require.main === module) {
	main().catch(error => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
