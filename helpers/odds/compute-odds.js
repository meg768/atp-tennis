#!/usr/bin/env node

/*
REGLER FÖR ODDSMODELLEN

Denna fil är facit för hur `compute-odds.js` räknar ut odds.
När modellen ändras ska den här kommentaren uppdateras först, så att reglerna
alltid finns samlade längst upp i filen.

Nuvarande regler:
1. Scriptet jämför två spelare och använder som standard Jannik Sinner mot Carlos Alcaraz.
2. Varje spelare slås upp i MariaDB via ATP-id eller spelarnamn.
3. Scriptet räknar inte längre ut odds själv i JavaScript.
4. All modellogik ska komma från SQL-filerna i `helpers/odds/queries/`.
5. Head-to-head från tabellen `matches` visas som stödinformation.
6. Alla SQL-filer i `helpers/odds/queries/` körs som separata delfaktorer.
7. Varje SQL-fil ska ha metadata i ett blockkommentarsformat överst i filen:
   - `@name`
   - `@description`
   - `@weight`
8. Varje SQL-query ska returnera exakt en rad med minst:
   - `winner`: `A`, `B` eller `null`
9. SQL-queryn får också returnera:
   - `summary`: kort text för utskrift
10. Varje SQL-fil sätter själv `@playerA` och `@playerB` i början av queryn.
11. Scriptet ersätter `:playerA` och `:playerB` med riktiga spelar-id innan SQL körs.
12. Själva SQL-logiken ska sedan använda `@playerA` och `@playerB`.
13. All annan information ska queryn själv läsa fram från databasen via dessa id:n.
14. Visningsnamn och standardvikt läses i första hand från SQL-filens metadata.
15. Query-resultaten summeras just nu till en experimentell faktorscore.
16. Om odds ska visas framöver ska de härledas från queries, inte från egen JS-logik.

Regel för fortsatt utbyggnad:
- Nya kriterier ska först dokumenteras i den här kommentaren innan de byggs in i koden.
- Markera för varje kriterium om det är:
  - endast information
  - sannolikhetsjusterande
  - endast output
- Om viktning eller flera delmodeller införs ska exakt formel dokumenteras här.
*/

const fs = require('fs');
const path = require('path');
const mysqlDriver = require('mysql');

require('dotenv').config({
	path: path.resolve(__dirname, '..', '..', '.env')
});

const mysql = require('../../src/mysql.js');
const QUERIES_DIR = path.resolve(__dirname, 'queries');

function printUsage() {
	console.log('Usage: ./helpers/odds/compute-odds.js [playerA] [playerB]');
	console.log('Example: ./helpers/odds/compute-odds.js "Jannik Sinner" Alcaraz');
	console.log('You can use ATP player ids or player names.');
	console.log('Default matchup: Jannik Sinner vs Carlos Alcaraz.');
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

function formatWeight(value) {
	return Number(value).toFixed(2);
}

function formatWeightPercent(value) {
	return `${Math.round(Number(value) * 100)}%`;
}

function buildOddsLine({ playerA, playerB, querySummary }) {
	return `Odds ${playerA.name} ${formatWeight(querySummary.playerA)} - ${formatWeight(querySummary.playerB)} ${playerB.name}`;
}

function formatRecord(wins, losses) {
	const safeWins = Number.isFinite(Number(wins)) ? Number(wins) : 0;
	const safeLosses = Number.isFinite(Number(losses)) ? Number(losses) : 0;
	return `${safeWins}-${safeLosses}`;
}

function escapeSqlValue(value) {
	return mysqlDriver.escape(value);
}

function buildQueryContext(playerA, playerB) {
	return {
		playerA: playerA.id,
		playerB: playerB.id
	};
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
				serve_rating,
				return_rating,
				pressure_rating,
				active,
				CASE
					WHEN UPPER(id) = UPPER(?) THEN 1
					WHEN LOWER(name) = LOWER(?) THEN 2
					WHEN LOWER(name) LIKE LOWER(?) THEN 3
					ELSE 4
				END AS match_score
			FROM players
			WHERE
				UPPER(id) = UPPER(?)
				OR LOWER(name) = LOWER(?)
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
		format: [normalized, normalized, `%${normalized}%`, normalized, normalized, `%${normalized}%`]
	});
}

async function getHeadToHead(playerA, playerB) {
	const rows = await mysql.query({
		sql: `
			SELECT
				SUM(CASE WHEN winner = ? THEN 1 ELSE 0 END) AS winsA,
				SUM(CASE WHEN winner = ? THEN 1 ELSE 0 END) AS winsB
			FROM matches
			WHERE
				(winner = ? AND loser = ?)
				OR
				(winner = ? AND loser = ?)
		`,
		format: [playerA.id, playerB.id, playerA.id, playerB.id, playerB.id, playerA.id]
	});

	return rows[0] || { winsA: 0, winsB: 0 };
}

function loadQueries() {
	if (!fs.existsSync(QUERIES_DIR)) {
		return [];
	}

	return fs
		.readdirSync(QUERIES_DIR)
		.filter(file => file.endsWith('.sql'))
		.sort()
		.map(file => parseQueryFile(path.join(QUERIES_DIR, file), file));
}

function parseQueryFile(filePath, fileName) {
	const text = fs.readFileSync(filePath, 'utf8');
	const metadata = {
		name: null,
		description: null,
		weight: null
	};

	const blockMatch = text.match(/\/\*([\s\S]*?)\*\//);

	if (blockMatch) {
		let currentKey = null;
		let currentLines = [];

		function commitCurrent() {
			if (!currentKey) {
				return;
			}

			const value = currentLines.join('\n').trim();

			if (currentKey === 'name') {
				metadata.name = value || null;
			} else if (currentKey === 'description') {
				metadata.description = value || null;
			} else if (currentKey === 'weight') {
				metadata.weight = value || null;
			}
		}

		for (const rawLine of blockMatch[1].split(/\r?\n/)) {
			const line = rawLine.replace(/^\s*\*?\s?/, '');
			const match = line.match(/^@([a-zA-Z][a-zA-Z0-9_-]*)\s*(.*)$/);

			if (match) {
				commitCurrent();
				currentKey = match[1];
				currentLines = [];

				if (match[2]) {
					currentLines.push(match[2]);
				}

				continue;
			}

			if (currentKey) {
				currentLines.push(line);
			}
		}

		commitCurrent();
	}

	return {
		id: path.basename(fileName, '.sql'),
		file: fileName,
		sql: text,
		meta: metadata
	};
}

function renderSqlTemplate(sql, context) {
	return sql.replace(/:([a-zA-Z][a-zA-Z0-9_]*)/g, (match, key) => {
		if (!Object.prototype.hasOwnProperty.call(context, key)) {
			throw new Error(`SQL-query refererar till okänd variabel :${key}`);
		}

		return escapeSqlValue(context[key]);
	});
}

function getQueryRows(result) {
	if (Array.isArray(result)) {
		for (let index = result.length - 1; index >= 0; index -= 1) {
			if (Array.isArray(result[index])) {
				return result[index];
			}
		}
	}

	return Array.isArray(result) ? result : [];
}

async function runQueries({ mysql, playerA, playerB }) {
	const queries = loadQueries();
	const results = [];
	const sqlContext = buildQueryContext(playerA, playerB);

	for (const query of queries) {
		const renderedSql = renderSqlTemplate(query.sql, sqlContext);
		const rows = getQueryRows(await mysql.query(renderedSql));
		const raw = rows[0] || {};
		const configuredWeight = raw.weight ?? query.meta.weight ?? 1;
		const weight = Number.isFinite(Number(configuredWeight)) ? Number(configuredWeight) : 1;
		const winner = raw.winner === 'A' || raw.winner === 'B' ? raw.winner : null;

		results.push({
			id: query.id,
			title: raw.title || query.meta.name || query.id,
			description: query.meta.description || '',
			winner,
			weight,
			summary: raw.summary || '',
			data: raw.data || null,
			scoreA: winner === 'A' ? weight : 0,
			scoreB: winner === 'B' ? weight : 0
		});
	}

	return results;
}

function summarizeQueryResults(results) {
	return results.reduce(
		(summary, result) => {
			summary.playerA += result.scoreA;
			summary.playerB += result.scoreB;
			return summary;
		},
		{ playerA: 0, playerB: 0 }
	);
}

function getWinnerLabel(result, playerA, playerB) {
	if (result.winner === 'A') {
		return playerA.name;
	}

	if (result.winner === 'B') {
		return playerB.name;
	}

	return 'Ingen';
}

function printPlayerSelectionError(label, search, rows) {
	console.error(`Could not uniquely resolve ${label}: "${search}"`);

	if (!Array.isArray(rows) || rows.length === 0) {
		console.error('No matching players found in the database.');
		return;
	}

	console.error('Matches found:');

	for (const row of rows) {
		console.error(`- ${row.name} (${row.id}) rank ${formatRank(row.rank)} ELO ${formatElo(row.elo_rank)}`);
	}
}

async function resolvePlayer(label, search) {
	const rows = await findPlayers(search);

	if (rows.length === 0) {
		printPlayerSelectionError(label, search, rows);
		process.exitCode = 1;
		return null;
	}

	const top = rows[0];
	const second = rows[1];
	const topScore = Number(top.match_score);
	const secondScore = second ? Number(second.match_score) : null;

	if (second && topScore === secondScore) {
		printPlayerSelectionError(label, search, rows);
		process.exitCode = 1;
		return null;
	}

	return top;
}

async function main() {
	const args = process.argv.slice(2);
	const wantsHelp = args.some(isHelpFlag);

	if (wantsHelp) {
		printUsage();
		process.exitCode = 0;
		return;
	}

	const searchA = args[0] || 'Jannik Sinner';
	const searchB = args[1] || 'Carlos Alcaraz';

	if (String(searchA).trim().toLowerCase() === String(searchB).trim().toLowerCase()) {
		throw new Error('Choose two different players.');
	}

	await mysql.connect();

	try {
		const playerA = await resolvePlayer('playerA', searchA);
		const playerB = await resolvePlayer('playerB', searchB);

		if (!playerA || !playerB) {
			return;
		}

		const headToHead = await getHeadToHead(playerA, playerB);
		const queryResults = await runQueries({ mysql, playerA, playerB });
		const querySummary = summarizeQueryResults(queryResults);

		console.log(`${playerA.name} vs ${playerB.name}`);
		console.log('');
		console.log(`${playerA.name}:`);
		console.log(`  id: ${playerA.id}`);
		console.log(`  country: ${playerA.country || '-'}`);
		console.log(`  rank: ${formatRank(playerA.rank)}`);
		console.log(`  elo: ${formatElo(playerA.elo_rank)}`);
		console.log('');
		console.log(`${playerB.name}:`);
		console.log(`  id: ${playerB.id}`);
		console.log(`  country: ${playerB.country || '-'}`);
		console.log(`  rank: ${formatRank(playerB.rank)}`);
		console.log(`  elo: ${formatElo(playerB.elo_rank)}`);
		console.log('');
		console.log('Debug per query:');

		for (const result of queryResults) {
			const winnerLabel = getWinnerLabel(result, playerA, playerB);
			console.log(`  - ${result.title}: ${winnerLabel} (${formatWeightPercent(result.weight)})`);
		}

		console.log('');
		console.log(buildOddsLine({ playerA, playerB, querySummary }));
	} finally {
		await mysql.disconnect();
	}
}

main().catch(error => {
	console.error(error.message);
	process.exitCode = 1;
});
