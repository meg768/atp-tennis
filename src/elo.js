/*
	https://github.com/sleepomeno/tennis_atp/blob/master/examples/elo.R
*/

function getScoreIndex(score) {
	if (typeof score !== 'string' || score.trim() === '') {
		return null;
	}

	let winnerGames = 0;
	let loserGames = 0;
	let setsPlayed = 0;
	let tiebreaks = 0;

	const wasRetired = /Ret'?d|RET/i.test(score); // detect retirement
	const cleanedScore = score.replace(/Ret'?d|RET/gi, '').trim(); // remove RET markers
	const sets = cleanedScore.split(/\s+/);

	if (wasRetired) {
		return null;
	}

	sets.forEach((set) => {
		const hasTiebreak = /\(.*?\)/.test(set);
		if (hasTiebreak) tiebreaks++;

		const cleanedSet = set.replace(/\(.*?\)/g, '');

		if (/^\d{2}$/.test(cleanedSet)) {
			const g1 = parseInt(cleanedSet[0], 10);
			const g2 = parseInt(cleanedSet[1], 10);

			const isLikelyComplete = g1 >= 6 || g2 >= 6;

			if (isLikelyComplete) {
				setsPlayed++;
				if (g1 > g2) {
					winnerGames += g1;
					loserGames += g2;
				} else {
					winnerGames += g2;
					loserGames += g1;
				}
			}
		}
	});

	if (setsPlayed <= 1) {
		return null;
	}
	let x = 1 - (winnerGames + loserGames - 6 * setsPlayed) / (7 * setsPlayed);
	//console.log(`${score} : ${x}`);
	return x;
}

async function computeELO({ mysql }) {
	let elo = {};
	let count = {};

	let sql = `SELECT * FROM flatly WHERE event_date >= CURDATE() - INTERVAL 52 WEEK`;
	let format = [];

	let matches = await mysql.query({ sql, format });

	// Count matches and create entries
	for (let match of matches) {
		let { winner_id: playerA, loser_id: playerB } = match;

		let countA = count[playerA] || 0;
		let countB = count[playerB] || 0;

		count[playerA] = countA + 1;
		count[playerB] = countB + 1;
	}

	for (let match of matches) {
		let { winner_id: playerA, loser_id: playerB } = match;

		if (count[playerA] < 10 || count[playerB] < 10) {
			console.log(`Skipping ${match.winner}/${match.loser}`);
			continue;
		}

		let scoreIndex = getScoreIndex(match.score);

		if (scoreIndex == null) {
			continue;
		}

		let eloA = elo[playerA] || { rank: 1500, id: playerA, name: match.winner, matches: count[playerA] };
		let eloB = elo[playerB] || { rank: 1500, id: playerB, name: match.loser, matches: count[playerB] };

		let rA = eloA.rank;
		let rB = eloB.rank;

		let eA = 1 / (1 + (10 ^ ((rB - rA) / 400)));
		let eB = 1 / (1 + (10 ^ ((rA - rB) / 400)));

		let sA = 0.5 + scoreIndex / 2;
		let sB = 0;

		let kA = 250 / ((eloA.matches + 5) ^ 0.4);
		let kB = 250 / ((eloB.matches + 5) ^ 0.4);

		let k = match.event_type == 'Grand Slam' ? 1.1 : 1;

		// ??
		k = k * 4;
		
		eloA.rank = rA + k * kA * (sA - eA);
		eloB.rank = rB + k * kB * (sB - eB);

		elo[playerA] = eloA;
		elo[playerB] = eloB;
	}

	return elo;
}

async function updateELO({ mysql }) {
	let rankings = await computeELO({ mysql });

	await mysql.query(`UPDATE players SET elo_rank = NULL`);

	for (let [id, elo] of Object.entries(rankings)) {
		let sql = `UPDATE players SET elo_rank = ? WHERE id = ?`;
		let format = [elo.rank, elo.id];

		//console.log(`Updating ELO (${surface}) for ${elo.name}...`);

		await mysql.query({ sql, format });
	}
}

module.exports = { computeELO, updateELO, getScoreIndex };
