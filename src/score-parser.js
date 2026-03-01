/*
    ScoreParser - A class to parse and normalize tennis scores.

    Valid scores include formats like "6-3 7-5" and "6-1 6-4 1-1".
    May also include tie-break scores, e.g., "6(7)-7(9)".
    My also include compact formats like "63 75" or "6(7)7(9) 64".
    Current game score may be indicated with [30-30] appended at the end.
    Aborted scores (e.g., "RET", "W/O", "WALKOVER") should be normalized as an empty string
    A valid score may only contain digits, spaces, parentheses, brackets, and hyphens.
    If a game score like [0-15] is present, it must be the last token in the score string. If not move to the end of the string.
    Valid game scores are 0, 15, 30, 40, A and D. Any other game score should be considered invalid.
*/

class ScoreParser {
	constructor(score) {
		this.score = '';

		if (score !== undefined) {
			this.parse(score);
		}
	}

	parse(score) {
		function isCurrentGameToken(token) {
			return /^\[(0|15|30|40|A|D)-(0|15|30|40|A|D)\]$/i.test(token);
		}

		function normalizeCurrentGameToken(token) {
			const match = token.match(/^\[(0|15|30|40|A|D)-(0|15|30|40|A|D)\]$/i);
			return `[${match[1].toUpperCase()}-${match[2].toUpperCase()}]`;
		}

		function splitCompactGames(value) {
			if (!/^\d+$/.test(value)) {
				return null;
			}

			if (value.length === 2) {
				return [value[0], value[1]];
			}

			if (value.length === 3) {
				return [value[0], value.slice(1)];
			}

			if (value.length === 4) {
				return [value.slice(0, 2), value.slice(2)];
			}

			return null;
		}

		function normalizeTieBreakSet(leftGames, leftTieBreak, rightGames, rightTieBreak) {
			const left = String(leftGames);
			const right = String(rightGames);

			if (leftTieBreak == null && rightTieBreak == null) {
				return `${left}-${right}`;
			}

			if (leftTieBreak != null && rightTieBreak != null) {
				const loserTieBreak = parseInt(left, 10) < parseInt(right, 10) ? leftTieBreak : rightTieBreak;
				return `${left}-${right}(${loserTieBreak})`;
			}

			return `${left}-${right}(${leftTieBreak ?? rightTieBreak})`;
		}

		function normalizeSetToken(token) {
			let match = token.match(/^(\d+)-(\d+)$/);
			if (match) {
				return `${match[1]}-${match[2]}`;
			}

			match = token.match(/^(\d+)-(\d+)\((\d+)\)$/);
			if (match) {
				return normalizeTieBreakSet(match[1], null, match[2], match[3]);
			}

			match = token.match(/^(\d+)\((\d+)\)-(\d+)\((\d+)\)$/);
			if (match) {
				return normalizeTieBreakSet(match[1], match[2], match[3], match[4]);
			}

			match = token.match(/^(\d+)\((\d+)\)(\d+)\((\d+)\)$/);
			if (match) {
				return normalizeTieBreakSet(match[1], match[2], match[3], match[4]);
			}

			match = token.match(/^(\d+)(\d+)\((\d+)\)$/);
			if (match) {
				const games = splitCompactGames(`${match[1]}${match[2]}`);
				return games ? normalizeTieBreakSet(games[0], null, games[1], match[3]) : null;
			}

			match = token.match(/^(\d+)\((\d+)\)(\d+)$/);
			if (match) {
				const games = splitCompactGames(`${match[1]}${match[3]}`);
				return games ? normalizeTieBreakSet(games[0], match[2], games[1], null) : null;
			}

			const games = splitCompactGames(token);
			return games ? `${games[0]}-${games[1]}` : null;
		}

		if (typeof score !== 'string') {
			throw new Error('Invalid score.');
		}

		const trimmedScore = score.trim();

		if (!trimmedScore) {
			throw new Error('Invalid score.');
		}

		if (/\b(RET|RET'D|RETD|W\/O|WO|WALKOVER|DEF|ABD)\b/i.test(trimmedScore)) {
			this.score = '';
			return this.score;
		}

		if (/[^0-9()[\]\-\sAD]/i.test(trimmedScore)) {
			throw new Error(`Invalid score: ${score}`);
		}

		const tokens = trimmedScore.split(/\s+/);
		const setTokens = [];
		let currentGameToken = null;

		for (const token of tokens) {
			if (token.startsWith('[') || token.endsWith(']')) {
				if (!isCurrentGameToken(token)) {
					throw new Error(`Invalid score: ${score}`);
				}

				currentGameToken = normalizeCurrentGameToken(token);
				continue;
			}

			const normalizedSetToken = normalizeSetToken(token);

			if (!normalizedSetToken) {
				throw new Error(`Invalid score: ${score}`);
			}

			setTokens.push(normalizedSetToken);
		}

		if (setTokens.length === 0 && currentGameToken === null) {
			throw new Error(`Invalid score: ${score}`);
		}

		this.score = currentGameToken == null ? setTokens.join(' ') : [...setTokens, currentGameToken].join(' ');
		return this.score;
	}

	getGamesPlayed() {
		if (!this.score) {
			return 0;
		}

		return this.score
			.split(/\s+/)
			.filter(token => !/^\[(0|15|30|40|A|D)-(0|15|30|40|A|D)\]$/i.test(token))
			.reduce((sum, token) => {
				const setToken = token.replace(/\(\d+\)/g, '');
				const match = setToken.match(/^(\d+)-(\d+)$/);

				if (!match) {
					return sum;
				}

				return sum + parseInt(match[1], 10) + parseInt(match[2], 10);
			}, 0);
	}

	getSetsPlayed() {
		if (!this.score) {
			return 0;
		}

		return this.score
			.split(/\s+/)
			.filter(token => !/^\[(0|15|30|40|A|D)-(0|15|30|40|A|D)\]$/i.test(token))
			.length;
	}

	getTieBreaksPlayed() {
		if (!this.score) {
			return 0;
		}

		return this.score
			.split(/\s+/)
			.filter(token => !/^\[(0|15|30|40|A|D)-(0|15|30|40|A|D)\]$/i.test(token))
			.filter(token => /\(\d+\)/.test(token))
			.length;
	}

	getGameScore() {
		if (!this.score) {
			return null;
		}

		const tokens = this.score.split(/\s+/);
		const lastToken = tokens[tokens.length - 1];
		const match = lastToken.match(/^\[(0|15|30|40|A|D)-(0|15|30|40|A|D)\]$/i);

		return match ? [match[1].toUpperCase(), match[2].toUpperCase()] : null;
	}
}

module.exports = ScoreParser;
