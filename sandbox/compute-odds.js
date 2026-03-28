#!/usr/bin/env node

const path = require('path');

require('dotenv').config({
	path: path.resolve(__dirname, '..', '.env')
});

const mysql = require('../src/mysql.js');
const ComputeOdds = require('../src/compute-odds.js');

async function main() {
	const input = {
		playerA: 'S0AG',
		playerB: 'A0E2',
		surface: 'Hard'
	};
	const computeOdds = new ComputeOdds({ mysql });

	mysql.log = () => {};
	mysql.error = () => {};

	await mysql.connect();

	try {
		const playerA = await computeOdds.getPlayer(input.playerA);
		const playerB = await computeOdds.getPlayer(input.playerB);
		const odds = await computeOdds.run(input);
		const result = {
			input,
			playerA,
			playerB,
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
