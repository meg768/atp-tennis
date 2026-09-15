#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repositoryRoot = path.resolve(__dirname, '../../../..');
const args = process.argv.slice(2);
const refresh = args.includes('--refresh');
const unknownOptions = args.filter(argument => argument.startsWith('--') && argument !== '--refresh');
const countArguments = args.filter(argument => !argument.startsWith('--'));
const count = Number(countArguments[0] ?? 20);

if (unknownOptions.length > 0 || countArguments.length > 1) {
	console.error('Usage: list-top-players.js [count] [--refresh]');
	process.exit(1);
}

if (!Number.isInteger(count) || count < 1 || count > 500) {
	console.error('Count must be an integer between 1 and 500.');
	process.exit(1);
}

require('dotenv').config({ path: path.join(repositoryRoot, '.env') });

const mysql = require(path.join(repositoryRoot, 'src/mysql'));
mysql.log = () => {};
mysql.error = () => {};

async function main() {
	let players;

	try {
		await mysql.connect();
		players = await mysql.query({
			sql: `
				SELECT id, name, \`rank\`, points
				FROM players
				WHERE \`rank\` IS NOT NULL AND points IS NOT NULL
				ORDER BY \`rank\` ASC, points DESC, id ASC
				LIMIT ?
			`,
			format: [count]
		});
	} finally {
		await mysql.disconnect();
	}

	if (players.length !== count) {
		throw new Error(`Database returned ${players.length} current ranked players; expected ${count}.`);
	}

	const headshotsDirectory = path.join(repositoryRoot, 'headshots');
	const missingPlayers = players.filter(player => {
		const filename = `${String(player.id).toUpperCase()}.png`;
		return !fs.existsSync(path.join(headshotsDirectory, filename));
	});
	const selectedPlayers = refresh ? players : missingPlayers;

	console.log(JSON.stringify({
		requestedCount: count,
		refresh,
		skippedExisting: refresh ? 0 : count - missingPlayers.length,
		selectedCount: selectedPlayers.length,
		players: selectedPlayers
	}, null, 2));
}

main().catch(error => {
	console.error(error.message);
	process.exitCode = 1;
});
