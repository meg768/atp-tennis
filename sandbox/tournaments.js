#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

require('dotenv').config({
	path: path.resolve(__dirname, '..', '.env')
});

const { getCurrentEvents } = require('../src/current-events.js');
const mysql = require('../src/mysql.js');

const OUTPUT_PATH = path.resolve(__dirname, 'output', 'tournaments.json');

async function main() {
	mysql.log = () => {};
	mysql.error = () => {};
	await mysql.connect();

	try {
		const payload = await getCurrentEvents({ mysql });
		fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
		fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
		console.log(OUTPUT_PATH);
	} finally {
		await mysql.disconnect();
	}
}

main().catch(error => {
	console.error(error.stack || String(error));
	process.exit(1);
});
