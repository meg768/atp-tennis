const Api = require('./api');
const searchPlayers = require('./search-players.js');

const SURFACE_KEYS = {
	hard: 'hElo',
	clay: 'cElo',
	grass: 'gElo'
};

const REPORT_URL = 'https://tennisabstract.com/reports/atp_elo_ratings.html';

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

function slugifyPlayerName(name) {
	return String(name || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^A-Za-z]/g, '');
}

function probabilityToOdds(probability, margin = 1.05) {
	const priced = clamp(Number(probability || 0) * margin, 0.001, 0.999);
	return Number((1 / priced).toFixed(2));
}

function eloProbability(eloA, eloB) {
	return 1 / (1 + (10 ** ((eloB - eloA) / 400)));
}

class ApiTennisAbstractOdds extends Api {

	normalizeSurface(surface) {
		const normalized = String(surface || '').trim().toLowerCase();
		return SURFACE_KEYS[normalized] || 'Elo';
	}

	async resolvePlayer(term) {
		const rows = await searchPlayers(this.mysql, term, 5);

		if (rows.length === 0) {
			throw new Error(`Player not found: ${term}`);
		}

		return rows[0];
	}

	async fetchHtml(url) {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
				'Accept': 'text/html,application/xhtml+xml'
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch Tennis Abstract page (${response.status})`);
		}

		return await response.text();
	}

	parseRatingsRow(html, playerName) {
		const slug = slugifyPlayerName(playerName);
		const marker = `player.cgi?p=${slug}`;
		const markerIndex = html.toLowerCase().indexOf(marker.toLowerCase());

		if (markerIndex === -1) {
			throw new Error(`Could not parse Tennis Abstract Elo report row for ${playerName}.`);
		}

		const rowStart = html.lastIndexOf('<tr>', markerIndex);
		const rowEnd = html.indexOf('</tr>', markerIndex);

		if (rowStart === -1 || rowEnd === -1) {
			throw new Error(`Incomplete Tennis Abstract Elo report row for ${playerName}.`);
		}

		const rowHtml = html.slice(rowStart, rowEnd + 5);
		const values = [...rowHtml.matchAll(/<td align="right">([\d.]+)<\/td>/g)].map((match) => Number(match[1]));

		if (values.length < 9) {
			throw new Error(`Incomplete Tennis Abstract Elo report row for ${playerName}.`);
		}

		return {
			eloRank: values[0],
			Elo: values[2],
			hEloRank: values[3],
			hElo: values[4],
			cEloRank: values[5],
			cElo: values[6],
			gEloRank: values[7],
			gElo: values[8]
		};
	}

	calculateOdds(ratingA, ratingB) {
		const probabilityA = eloProbability(ratingA, ratingB);
		const probabilityB = 1 - probabilityA;

		return {
			probabilityA,
			probabilityB,
			odds: [
				probabilityToOdds(probabilityA),
				probabilityToOdds(probabilityB)
			]
		};
	}

	async fetch({ playerA, playerB, surface = null, bestOf = 3 } = {}) {
		playerA = String(playerA || '').trim();
		playerB = String(playerB || '').trim();
		const ratingKey = this.normalizeSurface(surface);

		if (!playerA || !playerB) {
			throw new Error('playerA and playerB parameters are required.');
		}

		if (playerA.toUpperCase() === playerB.toUpperCase()) {
			throw new Error('playerA and playerB must be different.');
		}

		const [resolvedA, resolvedB] = await Promise.all([
			this.resolvePlayer(playerA),
			this.resolvePlayer(playerB)
		]);

		const reportHtml = await this.fetchHtml(REPORT_URL);
		const ratingsA = this.parseRatingsRow(reportHtml, resolvedA.name);
		const ratingsB = this.parseRatingsRow(reportHtml, resolvedB.name);
		const forecast = this.calculateOdds(ratingsA[ratingKey], ratingsB[ratingKey]);

		return {
			playerA: resolvedA,
			playerB: resolvedB,
			surface: surface ? String(surface) : null,
			bestOf: Number(bestOf) === 5 ? 5 : 3,
			ratingKey,
			ratingsA,
			ratingsB,
			probabilityA: forecast.probabilityA,
			probabilityB: forecast.probabilityB,
			odds: forecast.odds
		};
	}

	parse(raw) {
		return raw.odds;
	}
}

module.exports = ApiTennisAbstractOdds;
