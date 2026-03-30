#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

require('dotenv').config({
	path: path.resolve(__dirname, '..', '.env')
});

const mysql = require('../src/mysql.js');

async function main() {
	const outputDir = path.resolve(__dirname, 'output');
	const scriptName = path.basename(__filename, '.js');
	const parsedPath = path.join(outputDir, `${scriptName}.parsed.json`);
	const rawPath = path.join(outputDir, `${scriptName}.raw.json`);

	mysql.log = () => {};
	mysql.error = () => {};

	await mysql.connect();

	try {
		const query = 'Borg';
		const raw = await mysql.query({
			sql: 'SELECT PLAYER_LOOKUP(?) AS id',
			format: [query]
		});

		const parsed = raw;

		fs.mkdirSync(outputDir, { recursive: true });
		fs.writeFileSync(parsedPath, `${JSON.stringify(parsed, null, 2)}\n`);
		fs.writeFileSync(rawPath, `${JSON.stringify(raw, null, 2)}\n`);
	} finally {
		await mysql.disconnect();
	}
}

main().catch(error => {
	console.error(error.stack || String(error));
	process.exit(1);
});
