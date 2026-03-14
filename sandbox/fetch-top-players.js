#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FetchTopPlayers = require('../src/fetch-top-players');

async function main() {
	const outputDir = path.resolve(__dirname, 'output');
	const scriptName = path.basename(__filename, '.js');
	const parsedPath = path.join(outputDir, `${scriptName}.parsed.json`);
	const rawPath = path.join(outputDir, `${scriptName}.raw.json`);
	const fetcher = new FetchTopPlayers({ log: () => {} });
	const originalLog = console.log;
	console.log = () => {};

	try {
		const raw = await fetcher.fetch({ top: 100 });
		const parsed = fetcher.parse(raw);

		fs.mkdirSync(outputDir, { recursive: true });
		fs.writeFileSync(parsedPath, `${JSON.stringify(parsed, null, 2)}\n`);
		fs.writeFileSync(rawPath, `${JSON.stringify(raw, null, 2)}\n`);
	} finally {
		console.log = originalLog;
	}
}

main().catch(error => {
	console.error(error.stack || String(error));
	process.exit(1);
});
