const DEFAULT_MARGIN = 0.05;

class OddsFactor {
	constructor(context) {
		this.context = context;
	}

	compute() {
		throw new Error('compute() must be implemented by the factor.');
	}

	async querySingleValue(sql, format) {
		const { mysql } = this.context;

		if (!mysql) {
			throw new Error(`${this.constructor.name} requires a mysql connection.`);
		}

		const rows = await mysql.query({ sql, format });
		return rows[0] ? Object.values(rows[0])[0] : null;
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


// RankFactor delegates ranking logic to MariaDB via
// PLAYER_RANK_FACTOR(playerID, opponentID).
class RankFactor extends OddsFactor {
	async compute() {
		const { playerA, playerB } = this.context;
		const probabilityA = Number(await this.querySingleValue(
			'SELECT PLAYER_RANK_FACTOR(?, ?) AS rank_factor',
			[playerA.id, playerB.id]
		));

		if (!Number.isFinite(probabilityA) || probabilityA <= 0 || probabilityA >= 1) {
			throw new Error('Could not calculate rank factor.');
		}

		const probabilityB = 1 - probabilityA;

		return [probabilityA, probabilityB];
	}
}

// FormFactor delegates recent-form logic to MariaDB via
// PLAYER_FORM_FACTOR(playerID).
// The function returns one scalar form value per player (0..1),
// and this factor normalizes the two player values into a probability pair.
class FormFactor extends OddsFactor {
	async compute() {
		const { playerA, playerB } = this.context;
		const formA = Number(await this.querySingleValue(
			'SELECT PLAYER_FORM_FACTOR(?) AS form_factor',
			[playerA.id]
		));
		const formB = Number(await this.querySingleValue(
			'SELECT PLAYER_FORM_FACTOR(?) AS form_factor',
			[playerB.id]
		));
		const totalRate = formA + formB;

		if (!Number.isFinite(totalRate) || totalRate <= 0) {
			throw new Error('Could not calculate form factor probabilities.');
		}

		const probabilityA = formA / totalRate;
		const probabilityB = 1 - probabilityA;

		return [probabilityA, probabilityB];
	}
}

// HeadToHeadFactor delegates matchup-history logic to MariaDB via
// PLAYER_HEAD_TO_HEAD_FACTOR(playerID, opponentID, surface).
class HeadToHeadFactor extends OddsFactor {
	async compute() {
		const { playerA, playerB, surface } = this.context;
		const probabilityA = Number(await this.querySingleValue(
			'SELECT PLAYER_HEAD_TO_HEAD_FACTOR(?, ?, ?) AS head_to_head_factor',
			[playerA.id, playerB.id, surface]
		));

		if (!Number.isFinite(probabilityA) || probabilityA <= 0 || probabilityA >= 1) {
			throw new Error('Could not calculate head-to-head factor.');
		}

		const probabilityB = 1 - probabilityA;

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
			{ factor: new EloFactor(context), weight: 70 },
			{ factor: new RankFactor(context), weight: 10 },
			{ factor: new FormFactor(context), weight: 10 },
			{ factor: new HeadToHeadFactor(context), weight: 10 }
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
