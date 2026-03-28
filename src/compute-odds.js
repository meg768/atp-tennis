const DEFAULT_MARGIN = 0.05;

class OddsFactor {
	constructor(context) {
		this.context = context;
	}

	compute() {
		throw new Error('compute() must be implemented by the factor.');
	}
}

// EloFactor is the base strength model in the odds calculation.
// It picks the correct ELO column from the selected surface:
// - null => elo_rank
// - Hard => elo_rank_hard
// - Clay => elo_rank_clay
// - Grass => elo_rank_grass
// It then converts the two ELO values into a probability pair with the
// standard Elo logistic formula. A higher ELO gives a higher win chance,
// and the two returned probabilities always sum to 1.
class EloFactor extends OddsFactor {
	compute() {
		const { playerA, playerB, surface } = this.context;

		function getField(surface) {
			if (surface === 'Hard') {
				return 'elo_rank_hard';
			}

			if (surface === 'Clay') {
				return 'elo_rank_clay';
			}

			if (surface === 'Grass') {
				return 'elo_rank_grass';
			}

			return 'elo_rank';
		}

		const field = getField(surface);
		const eloA = Number(playerA[field]);
		const eloB = Number(playerB[field]);

		if (!Number.isFinite(eloA) || !Number.isFinite(eloB)) {
			throw new Error(`Both players must have a value in ${field}.`);
		}

		const probabilityA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
		const probabilityB = 1 - probabilityA;

		return [probabilityA, probabilityB];
	}
}


// FatigueFactor estimates player fatigue based on recent match load.
// It counts the number of completed matches each player has played
// over the last N days and applies an exponential decay:
//
//   fatigue = exp(-DECAY * matches)
//
// Fewer matches → higher fatigue score (more rested).
// More matches → lower fatigue score (more tired).
//
// The two fatigue scores are then normalized into probabilities.
//
// Tunable parameters:
// - DAYS controls how far back to look (default 7 days).
// - DECAY controls how strongly fatigue impacts performance.
//   Higher values penalize frequent play more aggressively.
//
// This factor should remain fairly light (e.g. 5% weight),
// as it captures short-term effects that complement ELO and form.
class FatigueFactor extends OddsFactor {
	async compute() {
		const { playerA, playerB, mysql } = this.context;

		if (!mysql) {
			throw new Error('FatigueFactor requires a mysql connection.');
		}

		const DAYS = 7;
		const DECAY = 0.15;

		async function getMatchesLastDays(player) {
			const rows = await mysql.query({
				sql: `
					SELECT COUNT(*) AS matches
					FROM matches m
					JOIN events e ON e.id = m.event
					WHERE
						m.status = 'Completed'
						AND e.date IS NOT NULL
						AND e.date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
						AND (m.winner = ? OR m.loser = ?)
				`,
				format: [DAYS, player, player]
			});

			return Number(rows[0]?.matches || 0);
		}

		const matchesA = await getMatchesLastDays(playerA.id);
		const matchesB = await getMatchesLastDays(playerB.id);

		const fatigueA = Math.exp(-DECAY * matchesA);
		const fatigueB = Math.exp(-DECAY * matchesB);

		const total = fatigueA + fatigueB;

		if (!Number.isFinite(total) || total <= 0) {
			return [0.5, 0.5];
		}

		const probabilityA = fatigueA / total;
		const probabilityB = fatigueB / total;

		return [probabilityA, probabilityB];
	}
}

// RankFactor converts the current ATP ranking into a linear probability.
// Lower rank is better, so rank #1 gets an advantage over rank #2, #10, etc.
// The probability is centered around 50% and scaled by the relative gap:
// 0.5 + (rankB - rankA) / (2 * (rankA + rankB)).
class RankFactor extends OddsFactor {
	compute() {
		const { playerA, playerB } = this.context;

		const rankA = Number(playerA.rank);
		const rankB = Number(playerB.rank);

		if (!Number.isFinite(rankA) || rankA <= 0 || !Number.isFinite(rankB) || rankB <= 0) {
			throw new Error('Both players must have a positive current rank.');
		}

		// Log-skalning: jämnar ut skillnader i rank
		// (skillnaden mellan 5 och 20 är större än 105 och 120)
		const score = Math.log(rankB) - Math.log(rankA);

		// Logistisk funktion för att mappa till sannolikhet
		let probabilityA = 1 / (1 + Math.exp(-score));

		// Clamp för säkerhet
		probabilityA = Math.max(0.01, Math.min(0.99, probabilityA));

		const probabilityB = 1 - probabilityA;

		return [probabilityA, probabilityB];
	}
}

// FormFactor measures recent form from the latest 10 completed matches.
// If a specific surface is selected, only matches on that surface are used.
// The factor uses a smoothed win rate: (wins + 1) / (matches + 2).
class FormFactor extends OddsFactor {
	async compute() {
		const { playerA, playerB, mysql, surface } = this.context;

		if (!mysql) {
			throw new Error('FormFactor requires a mysql connection.');
		}

		async function getRecentForm(player, surface) {
			let sql = `
				SELECT
					m.winner,
					m.loser
				FROM matches m
				JOIN events e ON e.id = m.event
				WHERE
					m.status = 'Completed'
					AND e.date IS NOT NULL
					AND (m.winner = ? OR m.loser = ?)
			`;

			let format = [player, player];

			if (surface) {
				sql += ` AND e.surface = ?`;
				format.push(surface);
			}

			sql += ` ORDER BY e.date DESC, m.id DESC LIMIT 10`;

			const rows = await mysql.query({ sql, format });
			const matches = rows.length;
			const wins = rows.filter(row => row.winner === player).length;
			const rate = (wins + 1) / (matches + 2);

			return { rate };
		}

		const formA = await getRecentForm(playerA.id, surface);
		const formB = await getRecentForm(playerB.id, surface);
		const totalRate = formA.rate + formB.rate;

		if (!Number.isFinite(totalRate) || totalRate <= 0) {
			return [0.5, 0.5];
		}

		const probabilityA = formA.rate / totalRate;
		const probabilityB = 1 - probabilityA;

		return [probabilityA, probabilityB];
	}
}

// HeadToHeadFactor measures the recent inbordes moten between the two players.
// If a specific surface is selected, only head-to-head matches on that surface
// are used. Otherwise all surfaces are included.
//
// Tunable parameters:
// - YEARS controls how far back in time the head-to-head history should go.
// - WIN_OFFSET and MATCH_OFFSET control the smoothing:
//   (wins + WIN_OFFSET) / (matches + MATCH_OFFSET)
// - Returning [0.5, 0.5] when there is no history keeps the factor neutral.
//
// This factor should usually stay fairly light, because head-to-head data can
// be noisy when the sample is small or old.
class HeadToHeadFactor extends OddsFactor {
	async compute() {
		const { playerA, playerB, mysql, surface } = this.context;

		if (!mysql) {
			throw new Error('HeadToHeadFactor requires a mysql connection.');
		}

		const YEARS = 2;
		const WIN_OFFSET = 1;
		const MATCH_OFFSET = 2;

		let sql = `
			SELECT
				m.winner,
				m.loser
			FROM matches m
			JOIN events e ON e.id = m.event
			WHERE
				m.status = 'Completed'
				AND e.date IS NOT NULL
				AND e.date >= DATE_SUB(CURDATE(), INTERVAL ${YEARS} YEAR)
				AND (
					(m.winner = ? AND m.loser = ?)
					OR
					(m.winner = ? AND m.loser = ?)
				)
		`;

		const format = [playerA.id, playerB.id, playerB.id, playerA.id];

		if (surface) {
			sql += ` AND e.surface = ?`;
			format.push(surface);
		}

		sql += ` ORDER BY e.date DESC, m.id DESC`;

		const rows = await mysql.query({ sql, format });
		const matches = rows.length;

		if (matches === 0) {
			return [0.5, 0.5];
		}

		const winsA = rows.filter(row => row.winner === playerA.id).length;
		const winsB = rows.filter(row => row.winner === playerB.id).length;
		const rateA = (winsA + WIN_OFFSET) / (matches + MATCH_OFFSET);
		const rateB = (winsB + WIN_OFFSET) / (matches + MATCH_OFFSET);
		const totalRate = rateA + rateB;

		if (!Number.isFinite(totalRate) || totalRate <= 0) {
			return [0.5, 0.5];
		}

		const probabilityA = rateA / totalRate;
		const probabilityB = rateB / totalRate;

		return [probabilityA, probabilityB];
	}
}

class ComputeOdds {
	constructor(options = {}) {
		this.mysql = options.mysql;
	}

	toDecimalOdds(probability) {
		if (!Number.isFinite(Number(probability)) || Number(probability) <= 0) {
			return null;
		}

		return 1 / Number(probability);
	}

	applyMargin(probability, margin = 0) {
		if (!Number.isFinite(Number(probability)) || Number(probability) <= 0) {
			return null;
		}

		const adjustedProbability = Number(probability) * (1 + Number(margin));

		if (adjustedProbability >= 1) {
			return 1.01;
		}

		return 1 / adjustedProbability;
	}

	async getPlayer(id) {
		const rows = await this.mysql.query({
			sql: `
				SELECT
					id,
					name,
					country,
					rank,
					elo_rank,
					elo_rank_hard,
					elo_rank_clay,
					elo_rank_grass,
					active
				FROM players
				WHERE UPPER(id) = UPPER(?)
				LIMIT 1
			`,
			format: [id]
		});

		return rows[0] || null;
	}

	async compute({ playerA, playerB, surface = null, margin = 0 } = {}) {
		const context = { playerA, playerB, surface, mysql: this.mysql };
		const factors = [
			{ factor: new EloFactor(context), weight: 72 },
			{ factor: new RankFactor(context), weight: 7 },
			{ factor: new FormFactor(context), weight: 7 },
			{ factor: new FatigueFactor(context), weight: 7 },
			{ factor: new HeadToHeadFactor(context), weight: 7 }
		];

		let sumA = 0;
		let sumB = 0;
		let totalWeight = 0;

		for (const entry of factors) {
			const [factorProbabilityA, factorProbabilityB] = await entry.factor.compute();

			sumA += factorProbabilityA * entry.weight;
			sumB += factorProbabilityB * entry.weight;
			totalWeight += entry.weight;
		}

		if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
			throw new Error('No valid factor weights configured.');
		}

		const probabilityA = sumA / totalWeight;
		const probabilityB = sumB / totalWeight;

		const totalProbability = probabilityA + probabilityB;

		if (!Number.isFinite(totalProbability) || totalProbability <= 0) {
			throw new Error('Could not calculate valid probabilities.');
		}

		const normalizedProbabilityA = probabilityA / totalProbability;
		const normalizedProbabilityB = probabilityB / totalProbability;

		if (Number(margin) === 0) {
			return [this.toDecimalOdds(normalizedProbabilityA), this.toDecimalOdds(normalizedProbabilityB)];
		}

		return [this.applyMargin(normalizedProbabilityA, margin), this.applyMargin(normalizedProbabilityB, margin)];
	}

	async run({ playerA, playerB, surface = null } = {}) {
		playerA = String(playerA || '').trim();
		playerB = String(playerB || '').trim();

		if (!playerA || !playerB) {
			throw new Error('playerA and playerB parameters are required.');
		}

		if (playerA.toUpperCase() === playerB.toUpperCase()) {
			throw new Error('playerA and playerB must be different.');
		}

		const playerARow = await this.getPlayer(playerA);
		const playerBRow = await this.getPlayer(playerB);

		if (!playerARow) {
			throw new Error(`Player not found: ${playerA}`);
		}

		if (!playerBRow) {
			throw new Error(`Player not found: ${playerB}`);
		}

		return await this.compute({
			playerA: playerARow,
			playerB: playerBRow,
			surface,
			margin: DEFAULT_MARGIN
		});
	}
}

module.exports = ComputeOdds;
