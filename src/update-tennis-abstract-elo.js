const REPORT_URL = 'https://tennisabstract.com/reports/atp_elo_ratings.html';

function slugifyPlayerName(name) {
	return String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z]/g, '').toLowerCase();
}

function parseRatingsReport(html) {
	const ratings = [];
	const rows = String(html || '').match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];

	for (const rowHtml of rows) {
		const playerMatch = rowHtml.match(/player\.cgi\?p=([^"'&<\s]+)/i);
		if (!playerMatch) continue;

		const values = [...rowHtml.matchAll(/<td\b[^>]*align=["']?right["']?[^>]*>\s*([\d.]+)\s*<\/td>/gi)].map(match => Number(match[1]));
		if (values.length < 9 || ![values[2], values[4], values[6], values[8]].every(Number.isFinite)) continue;

		ratings.push({
			slug: slugifyPlayerName(decodeURIComponent(playerMatch[1])),
			elo: Math.round(values[2]),
			hard: Math.round(values[4]),
			clay: Math.round(values[6]),
			grass: Math.round(values[8])
		});
	}

	if (ratings.length === 0) throw new Error('Tennis Abstract Elo report did not contain any readable player ratings.');
	return ratings;
}

async function fetchRatingsReport() {
	const response = await fetch(REPORT_URL, { headers: { 'User-Agent': 'Mozilla/5.0 Safari/605.1.15', 'Accept': 'text/html,application/xhtml+xml' } });
	if (!response.ok) throw new Error(`Failed to fetch Tennis Abstract Elo report (${response.status}).`);
	return parseRatingsReport(await response.text());
}

class UpdateTennisAbstractElo {
	constructor({ mysql, log = console.log }) {
		this.mysql = mysql;
		this.log = log;
	}

	async run() {
		await this.log('Fetching Elo ratings from Tennis Abstract...');
		const ratings = await fetchRatingsReport();
		const players = await this.mysql.query('SELECT id, name FROM players');
		const playersBySlug = new Map();

		for (const player of players) {
			const slug = slugifyPlayerName(player.name);
			const matches = playersBySlug.get(slug) || [];
			matches.push(player);
			playersBySlug.set(slug, matches);
		}

		const updates = [];
		let ambiguous = 0;
		for (const rating of ratings) {
			const matches = playersBySlug.get(rating.slug) || [];
			if (matches.length === 1) updates.push({ ...rating, id: matches[0].id });
			else if (matches.length > 1) ambiguous++;
		}

		if (updates.length === 0) throw new Error('No Tennis Abstract Elo rows matched players in the database.');
		await this.log(`Matched ${updates.length} of ${ratings.length} Tennis Abstract ratings${ambiguous ? `; skipped ${ambiguous} ambiguous names` : ''}.`);
		await this.mysql.query('START TRANSACTION');

		try {
			await this.mysql.query('UPDATE players SET elo_rank = NULL, elo_rank_hard = NULL, elo_rank_clay = NULL, elo_rank_grass = NULL');
			for (const update of updates) {
				await this.mysql.query({
					sql: 'UPDATE players SET elo_rank = ?, elo_rank_hard = ?, elo_rank_clay = ?, elo_rank_grass = ? WHERE id = ?',
					format: [update.elo, update.hard, update.clay, update.grass, update.id]
				});
			}
			await this.mysql.query('COMMIT');
		} catch (error) {
			await this.mysql.query('ROLLBACK');
			throw error;
		}

		await this.log(`Tennis Abstract Elo import completed for ${updates.length} players. Players absent from the report remain without Elo values.`);
		return { fetched: ratings.length, updated: updates.length, ambiguous };
	}
}

module.exports = UpdateTennisAbstractElo;
module.exports.REPORT_URL = REPORT_URL;
module.exports.parseRatingsReport = parseRatingsReport;
module.exports.slugifyPlayerName = slugifyPlayerName;
