/*
await new ComputeOdds().compute({ playerA, playerB, surface, margin, mysql })

Purpose:
- Keep the odds calculation isolated from CLI/output code.
- Keep room for multiple factor classes in the same file.
- Let ComputeOdds orchestrate factors while each factor class shares the same base contract.
- Let each factor return only a probability pair, while ComputeOdds owns the weighting.

Inputs:
- playerA: player row
- playerB: player row
- surface:
  - null
  - Hard
  - Clay
  - Grass
- mysql: active database connection, needed by factors that query match history
- margin:
  - 0 means "fair odds"
  - 0.05 means a 5% bookmaker margin

How the calculation works:
1. Build a list of factor entries.
2. Each factor returns only:
   [probabilityA, probabilityB]
3. ComputeOdds multiplies each factor result by that factor's weight.
4. Weighted probabilities are normalized by total weight into one final probability pair.
   This means weights do not need to sum to 1.
   Examples:
   - 0.8, 0.1, 0.1
   - 80, 10, 10
   - 10, 20, 30
5. If margin is 0:
   - convert both probabilities directly to decimal odds
6. If margin is greater than 0:
   - multiply each implied probability by (1 + margin)
   - convert those adjusted probabilities to decimal odds

Return value:
- [oddsA, oddsB]

Notes:
- This module intentionally returns only odds, not formatted output.
- Validation is strict: both players must have numeric ELO values in the chosen field.
- The caller is responsible for printing probabilities, labels, and comparisons.
- Current default weighting:
  - EloFactor: 75
  - RankFactor: 10
  - FormFactor: 10
  - HeadToHeadFactor: 5
*/

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

		const difference = rankB - rankA;
		const total = rankA + rankB;
		const probabilityA = 0.5 + difference / (2 * total);
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

			return { wins, matches, rate };
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

// HeadToHeadFactor measures the recent inbördes möten between the two players.
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
	async compute({ playerA, playerB, surface = null, margin = 0, mysql } = {}) {
		function toDecimalOdds(probability) {
			if (!Number.isFinite(Number(probability)) || Number(probability) <= 0) {
				return null;
			}

			return 1 / Number(probability);
		}

		function applyMargin(probability, margin = 0) {
			if (!Number.isFinite(Number(probability)) || Number(probability) <= 0) {
				return null;
			}

			const adjustedProbability = Number(probability) * (1 + Number(margin));

			if (adjustedProbability >= 1) {
				return 1.01;
			}

			return 1 / adjustedProbability;
		}

		const context = { playerA, playerB, surface, mysql };
		const factors = [
			{ factor: new EloFactor(context), weight:        70 },
			{ factor: new RankFactor(context), weight:       10 },
			{ factor: new FormFactor(context), weight:       10 },
			{ factor: new HeadToHeadFactor(context), weight: 10 }
		];

		let sumA = 0;
		let sumB = 0;
		let totalWeight = 0;

		for (const entry of factors) {
			const [probabilityA, probabilityB] = await entry.factor.compute();
			sumA += probabilityA * entry.weight;
			sumB += probabilityB * entry.weight;
			totalWeight += entry.weight;
		}

		if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
			throw new Error('No valid factor weights configured.');
		}

		const probabilityA = sumA / totalWeight;
		const probabilityB = sumB / totalWeight;

		if (Number(margin) === 0) {
			return [toDecimalOdds(probabilityA), toDecimalOdds(probabilityB)];
		}

		return [applyMargin(probabilityA, margin), applyMargin(probabilityB, margin)];
	}
}

module.exports = ComputeOdds;
