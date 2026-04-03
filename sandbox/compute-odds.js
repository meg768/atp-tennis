#!/usr/bin/env node

const path = require('path');

require('dotenv').config({
	path: path.resolve(__dirname, '..', '.env')
});

const mysql = require('../src/mysql.js');

async function main() {
	const input = {
		playerA: 'S0AG',
		playerB: 'A0E2',
		surface: 'Hard'
	};

	mysql.log = () => {};
	mysql.error = () => {};

	await mysql.connect();

	try {
		const playerA = await mysql.query({
			sql: 'SELECT id, name, country, rank, active FROM players WHERE UPPER(id) = UPPER(?) LIMIT 1',
			format: [input.playerA]
		});
		const playerB = await mysql.query({
			sql: 'SELECT id, name, country, rank, active FROM players WHERE UPPER(id) = UPPER(?) LIMIT 1',
			format: [input.playerB]
		});
		let odds = await mysql.query({
			sql: 'CALL PLAYER_ODDS(?, ?, ?)',
			format: [input.playerA, input.playerB, input.surface]
		});

		odds = Array.isArray(odds) && Array.isArray(odds[0]) ? odds[0] : odds;

		const result = {
			input,
			playerA: playerA[0] || null,
			playerB: playerB[0] || null,
			odds
		};

		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} finally {
		await mysql.disconnect();
	}
}

main().catch(error => {
	console.error(error.stack || String(error));
	process.exit(1);
});
