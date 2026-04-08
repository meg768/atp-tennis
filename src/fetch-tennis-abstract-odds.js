const searchPlayers = require('./search-players.js');

const SURFACE_KEYS = {
	hard: 'Hard',
	clay: 'Clay',
	grass: 'Grass'
};

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

function holdProbability(pointWinProbability) {
	const p = clamp(pointWinProbability, 0.001, 0.999);
	const q = 1 - p;
	const beforeDeuce = (p ** 4) * (1 + 4 * q + 10 * (q ** 2));
	const reachDeuce = 20 * (p ** 3) * (q ** 3);
	const deuceWin = (p ** 2) / (1 - (2 * p * q));
	return beforeDeuce + (reachDeuce * deuceWin);
}

function setWinProbability(gameWinProbability) {
	const p = clamp(gameWinProbability, 0.001, 0.999);
	const memo = new Map();

	function win(gamesA, gamesB) {
		const key = `${gamesA}:${gamesB}`;

		if (memo.has(key)) {
			return memo.get(key);
		}

		if (gamesA >= 6 && gamesA - gamesB >= 2) {
			return 1;
		}

		if (gamesB >= 6 && gamesB - gamesA >= 2) {
			return 0;
		}

		if (gamesA === 6 && gamesB === 6) {
			return p;
		}

		const result = (p * win(gamesA + 1, gamesB)) + ((1 - p) * win(gamesA, gamesB + 1));
		memo.set(key, result);
		return result;
	}

	return win(0, 0);
}

class FetchTennisAbstractOdds {
	constructor(options = {}) {
		this.mysql = options.mysql;
		this.log = options.log || console.log;
	}

	normalizeSurface(surface) {
		const normalized = String(surface || '').trim().toLowerCase();
		return SURFACE_KEYS[normalized] || null;
	}

	async resolvePlayer(term) {
		const rows = await searchPlayers(this.mysql, term, 5);

		if (rows.length === 0) {
			throw new Error(`Player not found: ${term}`);
		}

		return rows[0];
	}

	buildUrl(player) {
		const slug = slugifyPlayerName(player.name);

		if (!slug) {
			throw new Error(`Could not build Tennis Abstract slug for ${player.name}`);
		}

		return `https://www.tennisabstract.com/charting/${slug}.html`;
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

	extractSurfaceSample(html, surface) {
		const match = html.match(/It comprises shot-by-shot records of\s+(\d+)\s+matches,\s+including\s+(\d+)\s+on hard courts,\s+(\d+)\s+on clay,\s+and\s+(\d+)\s+on grass\./i);

		if (!match) {
			return null;
		}

		const [, overall, hard, clay, grass] = match.map(Number);

		if (surface === 'Hard') return hard;
		if (surface === 'Clay') return clay;
		if (surface === 'Grass') return grass;
		return overall;
	}

	extractRowMetrics(html, variableName, rowLabel) {
		const escapedLabel = rowLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const regex = new RegExp(`var ${variableName} = '.*?<tr><td align="left">${escapedLabel}<\\/td>.*?<span title="([^"]+)">[^<]*\\((\\d+)%\\)<\\/span>`, 'is');
		const match = html.match(regex);
		return match ? {
			title: match[1],
			displayPercent: Number(match[2]) / 100
		} : null;
	}

	extractPercentFromTitle(title, surface, fallbackPercent) {
		if (!title) {
			return null;
		}

		if (!surface) {
			return fallbackPercent == null ? null : fallbackPercent;
		}

		const surfaceRegex = new RegExp(`[A-Z]{2}\\s+${surface} Average:\\s*(\\d+)%`, 'i');
		const match = title.match(surfaceRegex);
		return match ? Number(match[1]) / 100 : null;
	}

	parseStats(html, surface) {
		const serveMetrics = this.extractRowMetrics(html, 'serve', 'All Serves');
		const returnMetrics = this.extractRowMetrics(html, 'return1', 'Total');

		const servePointsWon = this.extractPercentFromTitle(serveMetrics?.title, surface, serveMetrics?.displayPercent);
		const returnPointsWon = this.extractPercentFromTitle(returnMetrics?.title, surface, returnMetrics?.displayPercent);
		const sampleSize = this.extractSurfaceSample(html, surface);

		if (servePointsWon == null || returnPointsWon == null) {
			throw new Error('Could not parse Tennis Abstract stats.');
		}

		return {
			servePointsWon,
			returnPointsWon,
			sampleSize: Number(sampleSize || 0)
		};
	}

	shrinkToNeutral(probability, sampleSize) {
		const weight = sampleSize > 0 ? sampleSize / (sampleSize + 20) : 0;
		return 0.5 + ((probability - 0.5) * weight);
	}

	calculateOdds(statsA, statsB, options = {}) {
		const bestOf = Number(options.bestOf) === 5 ? 5 : 3;

		const serveA = this.shrinkToNeutral(statsA.servePointsWon, statsA.sampleSize);
		const returnA = this.shrinkToNeutral(statsA.returnPointsWon, statsA.sampleSize);
		const serveB = this.shrinkToNeutral(statsB.servePointsWon, statsB.sampleSize);
		const returnB = this.shrinkToNeutral(statsB.returnPointsWon, statsB.sampleSize);

		const pointWinOnServeA = clamp((serveA + (1 - returnB)) / 2, 0.35, 0.8);
		const pointWinOnServeB = clamp((serveB + (1 - returnA)) / 2, 0.35, 0.8);

		const holdA = holdProbability(pointWinOnServeA);
		const holdB = holdProbability(pointWinOnServeB);
		const gameWinA = clamp((holdA + (1 - holdB)) / 2, 0.05, 0.95);
		const setWinA = setWinProbability(gameWinA);

		let matchWinA = setWinA ** 2 * (3 - (2 * setWinA));

		if (bestOf === 5) {
			matchWinA = (setWinA ** 3) * (10 - (15 * setWinA) + (6 * (setWinA ** 2)));
		}

		const matchWinB = 1 - matchWinA;

		return [
			probabilityToOdds(matchWinA),
			probabilityToOdds(matchWinB)
		];
	}

	async fetch({ playerA, playerB, surface = null, bestOf = 3 } = {}) {
		playerA = String(playerA || '').trim();
		playerB = String(playerB || '').trim();
		surface = this.normalizeSurface(surface);

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

		const [htmlA, htmlB] = await Promise.all([
			this.fetchHtml(this.buildUrl(resolvedA)),
			this.fetchHtml(this.buildUrl(resolvedB))
		]);

		const statsA = this.parseStats(htmlA, surface);
		const statsB = this.parseStats(htmlB, surface);

		return {
			playerA: resolvedA,
			playerB: resolvedB,
			surface,
			bestOf: Number(bestOf) === 5 ? 5 : 3,
			statsA,
			statsB,
			odds: this.calculateOdds(statsA, statsB, { bestOf })
		};
	}

	parse(raw) {
		return raw.odds;
	}
}

module.exports = FetchTennisAbstractOdds;
