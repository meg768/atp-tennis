const Api = require('./api');
const searchPlayers = require('./search-players.js');

const SURFACE_KEYS = {
	hard: 'elo_rank_hard',
	clay: 'elo_rank_clay',
	grass: 'elo_rank_grass'
};

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
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
		return SURFACE_KEYS[normalized] || 'elo_rank';
	}

	async resolvePlayer(term) {
		const rows = await searchPlayers(this.mysql, term, 5);

		if (rows.length === 0) {
			throw new Error(`Player not found: ${term}`);
		}

		return rows[0];
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

	async fetch(options = null) {
		let { playerA, playerB, surface = null, bestOf = 3 } = this.resolveOptions(options);
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

		const ratingA = Number(resolvedA[ratingKey]);
		const ratingB = Number(resolvedB[ratingKey]);

		if (!Number.isFinite(ratingA) || !Number.isFinite(ratingB) || ratingA <= 0 || ratingB <= 0) {
			throw new Error(`Stored Tennis Abstract Elo is unavailable for ${resolvedA.name} or ${resolvedB.name}.`);
		}

		const forecast = this.calculateOdds(ratingA, ratingB);

		return {
			playerA: resolvedA,
			playerB: resolvedB,
			surface: surface ? String(surface) : null,
			bestOf: Number(bestOf) === 5 ? 5 : 3,
			ratingKey,
			ratingsA: resolvedA,
			ratingsB: resolvedB,
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
