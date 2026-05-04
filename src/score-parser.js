// Normalizes ATP archive score text into readable set scores.
// Example: "108 2119" becomes "10-8 21-19".
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

			// ATP archive often packs old deciding sets without a dash:
			// 108 -> 10-8, 119 -> 11-9, 1412 -> 14-12.
			if (token.length === 3 || token.length === 4) {
				return [token.slice(0, 2), token.slice(2)];
			}

			return null;
		}

		function correctSet(token) {
			if (!token || token.includes('-')) {
				return token;
			}

			// Keep ATP tie-break notation intact while expanding the set score:
			// 76(5) -> 7-6(5), 119(5) -> 11-9(5).
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
