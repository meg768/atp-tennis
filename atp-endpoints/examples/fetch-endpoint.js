#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function main() {
	const url = process.argv[2] || 'https://www.atptour.com/en/-/www/activity/last/S0AG';
	const outputArg = process.argv[3] || 'atp-endpoints/examples/activity.last.S0AG.fetched.json';
	const output = path.resolve(process.cwd(), outputArg);

	const response = await axios.get(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0',
			Referer: 'https://app.atptour.com/',
			Origin: 'https://app.atptour.com',
			Accept: 'application/json, text/plain, */*'
		},
		timeout: 30000,
		validateStatus: status => status >= 200 && status < 300
	});

	if (typeof response.data === 'string' && response.data.trimStart().startsWith('<!DOCTYPE html')) {
		throw new Error('Expected JSON but got HTML (likely blocked by anti-bot protection).');
	}

	let data = response.data;

	if (typeof data === 'string') {
		try {
			data = JSON.parse(data);
		} catch (error) {
			fs.writeFileSync(output, data, 'utf8');
			console.log(`Saved text response to ${output}`);
			return;
		}
	}

	fs.writeFileSync(output, JSON.stringify(data, null, 2), 'utf8');
	console.log(`Saved JSON response to ${output}`);
}

main().catch(error => {
	console.error(`Failed: ${error.message}`);
	process.exit(1);
});
