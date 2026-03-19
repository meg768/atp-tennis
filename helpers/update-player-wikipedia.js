#!/usr/bin/env node

const path = require('path');

require('dotenv').config({
	path: path.resolve(__dirname, '..', '.env')
});

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const mysql = require('../src/mysql.js');

const USER_AGENT = 'atp-tennis/1.0 (wikipedia helper)';
const TENNIS_PATTERN = /\b(tennis|atp|grand slam|masters 1000|challenger)\b/i;
const requestState = {
	minIntervalMs: 1200,
	maxRetries: 5,
	retryBaseMs: 5000,
	nextRequestAt: 0
};

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function setRequestConfig({ minIntervalMs, maxRetries, retryBaseMs }) {
	requestState.minIntervalMs = minIntervalMs;
	requestState.maxRetries = maxRetries;
	requestState.retryBaseMs = retryBaseMs;
}

async function waitForTurn() {
	const now = Date.now();
	const waitMs = Math.max(0, requestState.nextRequestAt - now);

	if (waitMs > 0) {
		await sleep(waitMs);
	}

	requestState.nextRequestAt = Date.now() + requestState.minIntervalMs;
}

function parseRetryAfter(value) {
	if (!value) {
		return null;
	}

	if (/^\d+$/.test(value)) {
		return Number(value) * 1000;
	}

	const timestamp = Date.parse(value);

	if (Number.isNaN(timestamp)) {
		return null;
	}

	return Math.max(0, timestamp - Date.now());
}

function stripDiacritics(value) {
	return String(value || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

function normalizeText(value) {
	return stripDiacritics(value)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function stripTags(value) {
	return String(value || '').replace(/<[^>]+>/g, ' ');
}

function unique(values) {
	return [...new Set(values.filter(Boolean))];
}

function buildWikipediaUrl(title) {
	return `https://en.wikipedia.org/wiki/${encodeURIComponent(title).replace(/%20/g, '_')}`;
}

function looksLikeTennisPage(text) {
	return TENNIS_PATTERN.test(String(text || ''));
}

function scoreCandidate(player, searchResult, summary) {
	const playerName = normalizeText(player.name);
	const title = normalizeText(summary?.title || searchResult?.title);
	const snippet = stripTags(searchResult?.snippet);
	const description = summary?.description || '';
	const extract = summary?.extract || '';
	const haystack = `${snippet} ${description} ${extract}`;
	const birthYear = player.birthdate ? String(player.birthdate).slice(0, 4) : null;
	let score = 0;

	if (title === playerName) {
		score += 60;
	} else if (title.startsWith(playerName) || playerName.startsWith(title)) {
		score += 35;
	}

	if (looksLikeTennisPage(description)) {
		score += 35;
	}

	if (looksLikeTennisPage(haystack)) {
		score += 25;
	}

	if (birthYear && haystack.includes(birthYear)) {
		score += 10;
	}

	if (/disambiguation/i.test(description) || summary?.type === 'disambiguation') {
		score -= 100;
	}

	if (/\b(football|cricket|actor|actress|politician|wrestler|baseball|basketball|ice hockey|cyclist)\b/i.test(haystack)) {
		score -= 50;
	}

	return score;
}

async function fetchJSON(url) {
	for (let attempt = 0; attempt <= requestState.maxRetries; attempt++) {
		await waitForTurn();

		const response = await fetch(url, {
			headers: {
				'accept': 'application/json',
				'user-agent': USER_AGENT
			}
		});

		if (response.ok) {
			return await response.json();
		}

		if (response.status === 404) {
			return null;
		}

		if (response.status === 429 && attempt < requestState.maxRetries) {
			const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
			const backoffMs = retryAfterMs ?? requestState.retryBaseMs * Math.pow(2, attempt);
			const jitterMs = Math.min(1000, Math.floor(Math.random() * 500));
			const waitMs = backoffMs + jitterMs;

			console.log(`Rate limited by Wikipedia, waiting ${Math.ceil(waitMs / 1000)}s before retrying...`);
			requestState.nextRequestAt = Date.now() + waitMs;
			continue;
		}

		throw new Error(`Request failed (${response.status}) for ${url}`);
	}

	throw new Error(`Request failed after ${requestState.maxRetries + 1} attempts for ${url}`);
}

async function fetchSummary(title) {
	const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
	return await fetchJSON(url);
}

async function searchWikipedia(query) {
	const url = new URL('https://en.wikipedia.org/w/api.php');
	url.searchParams.set('action', 'query');
	url.searchParams.set('list', 'search');
	url.searchParams.set('format', 'json');
	url.searchParams.set('utf8', '1');
	url.searchParams.set('srlimit', '3');
	url.searchParams.set('srsearch', query);

	const payload = await fetchJSON(url);
	return payload?.query?.search || [];
}

async function findWikipediaForPlayer(player) {
	const asciiName = stripDiacritics(player.name);
	const directTitles = unique([
		player.name,
		asciiName !== player.name ? asciiName : null
	]);

	for (const title of directTitles) {
		const summary = await fetchSummary(title);

		if (!summary) {
			continue;
		}

		const score = scoreCandidate(player, { title }, summary);

		if (score >= 85) {
			return {
				score,
				title: summary.title || title,
				url: buildWikipediaUrl(summary.title || title),
				source: 'direct'
			};
		}
	}

	const queries = unique([
		`"${player.name}" tennis`,
		asciiName !== player.name ? `"${asciiName}" tennis` : null,
		player.birthdate ? `"${player.name}" ${String(player.birthdate).slice(0, 4)} tennis` : null,
		player.birthdate && asciiName !== player.name ? `"${asciiName}" ${String(player.birthdate).slice(0, 4)} tennis` : null,
		`${player.name} ATP tennis`
	]);

	let best = null;

	for (const query of queries) {
		const results = await searchWikipedia(query);

		for (const searchResult of results) {
			const summary = await fetchSummary(searchResult.title);

			if (!summary) {
				continue;
			}

			const score = scoreCandidate(player, searchResult, summary);

			if (!best || score > best.score) {
				best = {
					score,
					title: summary.title || searchResult.title,
					url: buildWikipediaUrl(summary.title || searchResult.title),
					source: query
				};
			}
		}

		if (best && best.score >= 85) {
			break;
		}
	}

	if (best && best.score >= 60) {
		return best;
	}

	return null;
}

async function getPlayers({ limit, overwrite, player }) {
	const where = ['name IS NOT NULL', "TRIM(name) <> ''"];
	const format = [];
	let sql = `
		SELECT id, name, birthdate, wikipedia
		FROM players
	`;

	if (!overwrite) {
		where.push('wikipedia IS NULL');
	}

	if (player) {
		where.push('(id = ? OR name = ?)');
		format.push(String(player).toUpperCase(), String(player));
	}

	sql += `WHERE ${where.join(' AND ')} `;
	sql += `
		ORDER BY
			CASE
				WHEN rank BETWEEN 1 AND 100 THEN 0
				WHEN highest_rank IS NOT NULL
					OR COALESCE(career_titles, 0) > 0
					OR COALESCE(career_wins, 0) > 0
					OR COALESCE(career_prize, 0) > 0
				THEN 1
				ELSE 2
			END,
			CASE
				WHEN rank BETWEEN 1 AND 100 THEN rank
				ELSE 999999
			END,
			CASE
				WHEN highest_rank IS NULL THEN 999999
				ELSE highest_rank
			END,
			COALESCE(career_titles, 0) DESC,
			COALESCE(career_wins, 0) DESC,
			COALESCE(career_prize, 0) DESC,
			CASE
				WHEN rank IS NULL THEN 999999
				ELSE rank
			END,
			name
	`;

	if (limit > 0) {
		sql += 'LIMIT ?';
		format.push(limit);
	}

	return await mysql.query({ sql, format });
}

async function updatePlayerWikipedia({ id, wikipedia }) {
	await mysql.query({
		sql: 'UPDATE players SET wikipedia = ? WHERE id = ?',
		format: [wikipedia, id]
	});
}

async function main() {
	const argv = yargs(hideBin(process.argv))
		.option('limit', {
			type: 'number',
			default: 0,
			describe: 'Max antal spelare att processa (0 = alla)'
		})
		.option('player', {
			type: 'string',
			describe: 'Specifik spelare via id eller exakt namn'
		})
		.option('overwrite', {
			type: 'boolean',
			default: false,
			describe: 'Processa ocksa spelare som redan har wikipedia-lank'
		})
		.option('dry-run', {
			type: 'boolean',
			default: false,
			describe: 'Skriv bara ut forslag utan att uppdatera databasen'
		})
		.option('delay', {
			type: 'number',
			default: 1200,
			describe: 'Minsta paus i millisekunder mellan Wikipedia-anrop'
		})
		.option('retries', {
			type: 'number',
			default: 5,
			describe: 'Antal extra forsok vid 429 rate limit'
		})
		.option('retry-backoff', {
			type: 'number',
			default: 5000,
			describe: 'Startvarde i millisekunder for exponentiell backoff vid 429'
		})
		.help()
		.parse();

	setRequestConfig({
		minIntervalMs: Math.max(0, argv.delay),
		maxRetries: Math.max(0, argv.retries),
		retryBaseMs: Math.max(1000, argv.retryBackoff)
	});

	await mysql.connect();

	try {
		const players = await getPlayers({
			limit: argv.limit,
			overwrite: argv.overwrite,
			player: argv.player
		});

		if (players.length === 0) {
			console.log('No players matched the selection.');
			return;
		}

		let updated = 0;
		let found = 0;
		let missing = 0;

		console.log(`Checking Wikipedia for ${players.length} player(s)...`);

		for (const player of players) {
			try {
				const match = await findWikipediaForPlayer(player);

				if (!match) {
					missing++;
					console.log(`MISS  ${player.id}  ${player.name}`);

					if (!argv.dryRun) {
						await updatePlayerWikipedia({
							id: player.id,
							wikipedia: ''
						});
					}

					continue;
				}

				found++;

				if (match.url.length > 100) {
					console.log(`SKIP  ${player.id}  ${player.name}  URL too long for column (${match.url.length})`);
					continue;
				}

				console.log(`HIT   ${player.id}  ${player.name}  ->  ${match.url}  [score=${match.score}, source=${match.source}]`);

				if (!argv.dryRun) {
					await updatePlayerWikipedia({
						id: player.id,
						wikipedia: match.url
					});
					updated++;
				}
			} catch (error) {
				console.error(`ERROR ${player.id}  ${player.name}: ${error.message}`);
			}
		}

		console.log('');
		console.log(`Found: ${found}`);
		console.log(`Updated: ${argv.dryRun ? 0 : updated}`);
		console.log(`Missing: ${missing}`);
		console.log(`Mode: ${argv.dryRun ? 'dry-run' : 'write'}`);
	} finally {
		await mysql.disconnect();
	}
}

main().catch(async error => {
	console.error(error.stack || error.message);

	try {
		await mysql.disconnect();
	} catch (disconnectError) {
		console.error(disconnectError.message);
	}

	process.exit(1);
});
