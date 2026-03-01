/*
	https://github.com/sleepomeno/tennis_atp/blob/master/examples/elo.R
*/

function getScoreIndex(score) {
	if (typeof score !== 'string' || score.trim() === '') {
		return null;
	}

	const normalizedScore = normalizeScore(score);

	if (typeof normalizedScore !== 'string' || normalizedScore.trim() === '') {
		return null;
	}

	if (/\b(RET|RET'D|RETD|W\/O|WO|WALKOVER|DEF|ABD)\b/i.test(normalizedScore)) {
		return null;
	}

	let completedSets = 0;
	let totalGames = 0;

	for (const token of normalizedScore.toUpperCase().split(/\s+/)) {
		const games = parseSetToken(token);

		if (!games) {
			return null;
		}

		const [winnerGames, loserGames] = games;

		if (!isCompletedSet(winnerGames, loserGames)) {
			return null;
		}

		completedSets++;
		totalGames += winnerGames + loserGames;
	}

	if (completedSets < 2) {
		return null;
	}

	return 1 - (totalGames - 6 * completedSets) / (7 * completedSets);
}

function normalizeScore(rawScore) {
	if (!rawScore || typeof rawScore !== 'string') {
		return rawScore;
	}

	let text = rawScore.trim();

	text = text.replace(/\b(RET(?:['']?D)?|W\/O|WO|WALKOVER)\b\.?$/i, '').trim();

	if (!text) {
		return null;
	}

	const tokens = text.split(/\s+/);
	return tokens.map(normalizeSetToken).join(' ');
}

function normalizeSetToken(token) {
	if (token.includes('-')) {
		return token;
	}

	const tieBreakMatch = token.match(/^(\d+)\((\d+)\)$/);
	if (tieBreakMatch) {
		const games = parseCompactGames(tieBreakMatch[1]);

		if (!games) {
			return token;
		}

		return `${games[0]}-${games[1]}(${tieBreakMatch[2]})`;
	}

	const games = parseCompactGames(token);

	if (!games) {
		return token;
	}

	return `${games[0]}-${games[1]}`;
}

function parseSetToken(token) {
	const cleanToken = token.replace(/\([^)]*\)/g, '');

	const hyphenMatch = cleanToken.match(/^(\d+)-(\d+)$/);
	if (hyphenMatch) {
		return [parseInt(hyphenMatch[1], 10), parseInt(hyphenMatch[2], 10)];
	}

	return parseCompactGames(cleanToken);
}

function parseCompactGames(token) {
	if (!/^\d+$/.test(token)) {
		return null;
	}

	if (token.length === 2) {
		return [parseInt(token[0], 10), parseInt(token[1], 10)];
	}

	if (token.length === 3) {
		return [parseInt(token[0], 10), parseInt(token.slice(1), 10)];
	}

	if (token.length === 4) {
		return [parseInt(token.slice(0, 2), 10), parseInt(token.slice(2), 10)];
	}

	return null;
}

function isCompletedSet(a, b) {
	const high = Math.max(a, b);
	const low = Math.min(a, b);
	const diff = high - low;

	if (high < 6) {
		return false;
	}

	if (high === 6) {
		return diff >= 2;
	}

	if (high === 7) {
		return low === 5 || low === 6;
	}

	return diff === 2;
}

async function computeELO({ mysql }) {
	let elo = {};
	let count = {};

	let sql = `SELECT * FROM flatly WHERE event_date IS NOT NULL ORDER BY event_date ASC, id ASC`;
	let format = [];

	let matches = await mysql.query({ sql, format });

	for (let match of matches) {
		let { winner_id: playerA, loser_id: playerB } = match;

		if (!playerA || !playerB) {
			continue;
		}

		// Reuse score parsing only to ignore incomplete/retired matches.
		if (getScoreIndex(match.score) == null) {
			continue;
		}

		let matchesA = count[playerA] || 0;
		let matchesB = count[playerB] || 0;

		let eloA = elo[playerA] || { rank: 1500, id: playerA, name: match.winner };
		let eloB = elo[playerB] || { rank: 1500, id: playerB, name: match.loser };

		let rA = eloA.rank;
		let rB = eloB.rank;

		let eA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
		let eB = 1 / (1 + Math.pow(10, (rA - rB) / 400));

		let sA = 1;
		let sB = 0;

		let kA = 250 / Math.pow(matchesA + 5, 0.4);
		let kB = 250 / Math.pow(matchesB + 5, 0.4);

		let k = match.event_type == 'Grand Slam' ? 1.1 : 1;
		
		eloA.rank = rA + k * kA * (sA - eA);
		eloB.rank = rB + k * kB * (sB - eB);

		elo[playerA] = eloA;
		elo[playerB] = eloB;

		count[playerA] = matchesA + 1;
		count[playerB] = matchesB + 1;
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
