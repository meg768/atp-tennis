class ScoreParser {
	parse(rawScore) {
		const normalized =
			typeof rawScore === 'string' && rawScore.trim()
				? rawScore.trim()
				: null;

		function parseGames(token) {
			if (!/^\d+$/.test(token)) {
				return null;
			}

			if (token.length === 2) {
				return [token[0], token[1]];
			}

			if (token.length === 3 || token.length === 4) {
				return [token.slice(0, 2), token.slice(2)];
			}

			return null;
		}

		function correctSet(token) {
			if (!token || token.includes('-')) {
				return token;
			}

			const tieBreakMatch = token.match(/^(\d+)\((\d+)\)$/);
			if (tieBreakMatch) {
				const games = parseGames(tieBreakMatch[1]);
				return games ? `${games[0]}-${games[1]}(${tieBreakMatch[2]})` : token;
			}

			const games = parseGames(token);
			return games ? `${games[0]}-${games[1]}` : token;
		}

		return normalized
			? normalized
					.replace(/\b(RET(?:['']?D)?|W\/O|WO|WALKOVER)\b\.?$/i, '')
					.trim()
					.split(/\s+/)
					.map(correctSet)
					.join(' ') || null
			: null;
	}
}

module.exports = ScoreParser;
