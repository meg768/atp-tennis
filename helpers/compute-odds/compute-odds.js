/*
new ComputeOdds().compute(playerA, playerB, field, margin = 0)

Purpose:
- Keep the odds calculation isolated from CLI/output code.
- Read one ELO field from each player row and convert the ELO gap into decimal odds.

Inputs:
- playerA: object with an ELO value in the selected field
- playerB: object with an ELO value in the selected field
- field: which ELO field to use, for example:
  - elo_rank
  - elo_rank_hard
  - elo_rank_clay
  - elo_rank_grass
- margin:
  - 0 means "fair odds"
  - 0.05 means a 5% bookmaker margin

How the calculation works:
1. Read ELO for both players from the chosen field.
2. Convert ELO difference to win probability with the standard Elo logistic formula:
   probabilityA = 1 / (1 + 10 ^ ((eloB - eloA) / 400))
   probabilityB = 1 - probabilityA
3. If margin is 0:
   - convert both probabilities directly to decimal odds
4. If margin is greater than 0:
   - multiply each implied probability by (1 + margin)
   - convert those adjusted probabilities to decimal odds

Return value:
- [oddsA, oddsB]

Notes:
- This module intentionally returns only odds, not formatted output.
- Validation is strict: both players must have numeric ELO values in the chosen field.
- The caller is responsible for printing probabilities, labels, and comparisons.
*/

class ComputeOdds {
	compute(playerA, playerB, field, margin = 0) {
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

		const eloA = Number(playerA[field]);
		const eloB = Number(playerB[field]);

		if (!Number.isFinite(eloA) || !Number.isFinite(eloB)) {
			throw new Error(`Both players must have a value in ${field}.`);
		}

		const probabilityA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
		const probabilityB = 1 - probabilityA;

		if (Number(margin) === 0) {
			return [toDecimalOdds(probabilityA), toDecimalOdds(probabilityB)];
		}

		return [applyMargin(probabilityA, margin), applyMargin(probabilityB, margin)];
	}
}

module.exports = ComputeOdds;
