/*
    ScoreParser - A class to parse and normalize tennis scores.

    Valid scores include formats like "6-3 7-5" and "6-1 6-4 1-1".
    May also include tie-break scores, e.g., "6(7)-7(9)".
    My also include compact formats like "63 75" or "6(7)7(9) 64".
    Current game score may be indicated with [30-30] appended at the end.
    Aborted scores (e.g., "RET", "W/O", "WALKOVER") should be normalized as an empty string
    A valid score may only contain digits, spaces, parentheses, brackets, and hyphens.
    If a game score like [0-15] is present, it must be the last token in the score string. If not move to the end of the string.
    Valid game scores are 0, 15, 30, 40, and A. Any other game score should be considered invalid.

    At the of bottom of this file (under the JS code) is a tranlation of some methods into MariaDB SQL functions. 

    NUMBER_OF_GAMES(score) - Returns the total number of games played. Unnormalized scores are accepted. Returns null for invalid scores.
    NUMBER_OF_SETS(score) - Returns the number of set played. Unnormalized scores are accepted. Returns null for invalid scores.
    NUMBER_OF_TIE_BREAKS(score) - Returns the number tie-breaks played. Unnormalized scores are accepted. Returns null for invalid scores.
    
    All functions are generated with a DROP IF EXISTS statement to allow for easy redefinition during development.

    A testing section is also generated in SQL to validate the functions against a variety of inputs. 
    The following tests are included:

    NUMBER_OF_GAMES('6-4 7-6(3)')
    NUMBER_OF_GAMES('64 76(3)')
    NUMBER_OF_GAMES('')
    NUMBER_OF_GAMES(NULL)
    NUMBER_OF_SETS('6-4 7-6(3) 41')
    NUMBER_OF_SETS('64 7-6(3) 41')
    NUMBER_OF_GAMES('11 22')
    NUMBER_OF_TIE_BREAKS('6-4 7-6(3)') 
    NUMBER_OF_TIE_BREAKS('xyz') 
    NUMBER_OF_TIE_BREAKS('1-4(4) 4-1')

    Each row in the test output includes the the test name and the actual result from the test.
    
    */

class ScoreParser {
	constructor(score) {
		this.score = null;

		if (score !== undefined && score !== null) {
			this.parse(score);
		}
	}

	parse(score) {
		if (score === undefined || score === null) {
			this.score = null;
			return null;
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
			const left = String(parseInt(leftGames, 10));
			const right = String(parseInt(rightGames, 10));

			if (leftTieBreak == null && rightTieBreak == null) {
				return `${left}-${right}`;
			}

			if (leftTieBreak != null && rightTieBreak != null) {
				const loserTieBreak = parseInt(left, 10) < parseInt(right, 10) ? leftTieBreak : rightTieBreak;
				return `${left}-${right}(${parseInt(loserTieBreak, 10)})`;
			}

			return `${left}-${right}(${parseInt(leftTieBreak ?? rightTieBreak, 10)})`;
		}

		function normalizeSetToken(token) {
			let match = token.match(/^(\d+)-(\d+)$/);
			if (match) {
				return `${parseInt(match[1], 10)}-${parseInt(match[2], 10)}`;
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
			return games ? `${parseInt(games[0], 10)}-${parseInt(games[1], 10)}` : null;
		}

		function isGameToken(token) {
			return /^\[(0|15|30|40|A)-(0|15|30|40|A)\]$/i.test(token);
		}

		function normalizeGameToken(token) {
			const match = token.match(/^\[(0|15|30|40|A)-(0|15|30|40|A)\]$/i);
			return `[${match[1].toUpperCase()}-${match[2].toUpperCase()}]`;
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

		if (/[^0-9()[\]\-\sA]/i.test(trimmedScore)) {
			throw new Error(`Invalid score: ${score}`);
		}

		const tokens = trimmedScore.split(/\s+/);
		const setTokens = [];
		let gameToken = null;

		for (const token of tokens) {
			if (token.includes('[') || token.includes(']')) {
				if (!isGameToken(token)) {
					throw new Error(`Invalid score: ${score}`);
				}

				gameToken = normalizeGameToken(token);
				continue;
			}

			const normalizedSetToken = normalizeSetToken(token);

			if (!normalizedSetToken) {
				throw new Error(`Invalid score: ${score}`);
			}

			setTokens.push(normalizedSetToken);
		}

		if (setTokens.length === 0) {
			throw new Error(`Invalid score: ${score}`);
		}

		this.score = gameToken ? [...setTokens, gameToken].join(' ') : setTokens.join(' ');
		return this.score;
	}

	getGamesPlayed() {
		if (this.score === null) {
			return null;
		}

		if (!this.score) {
			return 0;
		}

		// Returns the total number of games already played across all set tokens.
		// Examples:
		// "6-4 7-6(3)" => 23
		// "6-4 3-1 [30-30]" => 14
		// "" => 0
		// The current game token in brackets is ignored because it is not a completed game.
		return this.score
			.split(/\s+/)
			.filter(token => !/^\[(0|15|30|40|A)-(0|15|30|40|A)\]$/i.test(token))
			.reduce((sum, token) => {
				const match = token.replace(/\(\d+\)/g, '').match(/^(\d+)-(\d+)$/);
				return match ? sum + parseInt(match[1], 10) + parseInt(match[2], 10) : sum;
			}, 0);
	}

	getSetsPlayed() {
		if (this.score === null) {
			return null;
		}

		if (!this.score) {
			return 0;
		}

		// Returns the number of set tokens in the normalized score.
		// Examples:
		// "6-4 7-6(3)" => 2
		// "6-4 3-1 [30-30]" => 2
		// "" => 0
		// The current game token in brackets is ignored because it is not a set.
		return this.score
			.split(/\s+/)
			.filter(token => !/^\[(0|15|30|40|A)-(0|15|30|40|A)\]$/i.test(token))
			.length;
	}

	getTieBreaksPlayed() {
		if (this.score === null) {
			return null;
		}

		if (!this.score) {
			return 0;
		}

		// Returns the number of sets that include a tie-break result.
		// Examples:
		// "7-6(3) 6-4" => 1
		// "6-7(5) 7-6(4) 7-6(8)" => 3
		// "6-4 3-1 [30-30]" => 0
		// Only set tokens ending with "(n)" are counted as tie-break sets.
		return this.score
			.split(/\s+/)
			.filter(token => !/^\[(0|15|30|40|A)-(0|15|30|40|A)\]$/i.test(token))
			.filter(token => /\(\d+\)$/.test(token))
			.length;
	}

	getGameScore() {
		if (this.score === null) {
			return null;
		}

		if (!this.score) {
			return null;
		}

		// Returns the current game score as "left-right" if a trailing game token exists.
		// Examples:
		// "6-4 3-1 [30-30]" => "30-30"
		// "6-4 3-1 [A-40]" => "A-40"
		// "6-4 7-6(3)" => null
		// Only the last token can represent the current game score.
		const tokens = this.score.split(/\s+/);
		const lastToken = tokens[tokens.length - 1];
		const match = lastToken.match(/^\[(0|15|30|40|A)-(0|15|30|40|A)\]$/i);

		return match ? `${match[1].toUpperCase()}-${match[2].toUpperCase()}` : null;
	}
}

module.exports = ScoreParser;

/* The testing goes here */

/*
    SELECT 'NUMBER_OF_GAMES(''6-4 7-6(3)'')' AS name, NUMBER_OF_GAMES('6-4 7-6(3)') AS result
    UNION ALL
    SELECT 'NUMBER_OF_GAMES(''64 76(3)'')', NUMBER_OF_GAMES('64 76(3)')
    UNION ALL
    SELECT 'NUMBER_OF_GAMES('''')', NUMBER_OF_GAMES('')
    UNION ALL
    SELECT 'NUMBER_OF_GAMES(NULL)', NUMBER_OF_GAMES(NULL)
    UNION ALL
    SELECT 'NUMBER_OF_SETS(''6-4 7-6(3) 41'')', NUMBER_OF_SETS('6-4 7-6(3) 41')
    UNION ALL
    SELECT 'NUMBER_OF_SETS(''64 7-6(3) 41'')', NUMBER_OF_SETS('64 7-6(3) 41')
    UNION ALL
    SELECT 'NUMBER_OF_GAMES(''11 22'')', NUMBER_OF_GAMES('11 22')
    UNION ALL
    SELECT 'NUMBER_OF_TIE_BREAKS(''6-4 7-6(3)'')', NUMBER_OF_TIE_BREAKS('6-4 7-6(3)')
    UNION ALL
    SELECT 'NUMBER_OF_TIE_BREAKS(''xyz'')', NUMBER_OF_TIE_BREAKS('xyz')
    UNION ALL
    SELECT 'NUMBER_OF_TIE_BREAKS(''1-4(4) 4-1'')', NUMBER_OF_TIE_BREAKS('1-4(4) 4-1');
*/


/* The MariaDB code */

/*

    DROP FUNCTION IF EXISTS NUMBER_OF_GAMES;
    DELIMITER ;;
    CREATE FUNCTION NUMBER_OF_GAMES(score TEXT)
    RETURNS INT
    DETERMINISTIC
    BEGIN
        DECLARE working TEXT;
        DECLARE token TEXT;
        DECLARE base_token TEXT;
        DECLARE pos INT;
        DECLARE left_games INT;
        DECLARE right_games INT;
        DECLARE total_games INT DEFAULT 0;
        DECLARE set_count INT DEFAULT 0;

        IF score IS NULL THEN
            RETURN NULL;
        END IF;

        IF TRIM(score) = '' THEN
            RETURN 0;
        END IF;

        SET working = UPPER(TRIM(score));

        IF working REGEXP '(^|[[:space:]])(RET|RET''D|RETD|W/O|WO|WALKOVER|DEF|ABD)($|[[:space:]])' THEN
            RETURN 0;
        END IF;

        SET working = REGEXP_REPLACE(working, '[[:space:]]+', ' ');

        WHILE working <> '' DO
            SET pos = LOCATE(' ', working);

            IF pos = 0 THEN
                SET token = working;
                SET working = '';
            ELSE
                SET token = LEFT(working, pos - 1);
                SET working = TRIM(SUBSTRING(working, pos + 1));
            END IF;

            IF token NOT REGEXP '^\\[(0|15|30|40|A)-(0|15|30|40|A)\\]$' THEN
                IF NOT (
                    token REGEXP '^[0-9]+-[0-9]+$' OR
                    token REGEXP '^[0-9]+-[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)-[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)[0-9]+$' OR
                    token REGEXP '^[0-9]{2,4}$'
                ) THEN
                    RETURN NULL;
                END IF;

                SET base_token = REGEXP_REPLACE(token, '\\([0-9]+\\)', '');

                IF base_token REGEXP '^[0-9]+-[0-9]+$' THEN
                    SET left_games = CAST(SUBSTRING_INDEX(base_token, '-', 1) AS UNSIGNED);
                    SET right_games = CAST(SUBSTRING_INDEX(base_token, '-', -1) AS UNSIGNED);
                ELSEIF CHAR_LENGTH(base_token) = 2 THEN
                    SET left_games = CAST(LEFT(base_token, 1) AS UNSIGNED);
                    SET right_games = CAST(RIGHT(base_token, 1) AS UNSIGNED);
                ELSEIF CHAR_LENGTH(base_token) = 3 THEN
                    SET left_games = CAST(LEFT(base_token, 1) AS UNSIGNED);
                    SET right_games = CAST(RIGHT(base_token, 2) AS UNSIGNED);
                ELSEIF CHAR_LENGTH(base_token) = 4 THEN
                    SET left_games = CAST(LEFT(base_token, 2) AS UNSIGNED);
                    SET right_games = CAST(RIGHT(base_token, 2) AS UNSIGNED);
                ELSE
                    RETURN NULL;
                END IF;

                SET total_games = total_games + left_games + right_games;
                SET set_count = set_count + 1;
            END IF;
        END WHILE;

        IF set_count = 0 THEN
            RETURN NULL;
        END IF;

        RETURN total_games;
    END;;
    DELIMITER ;

    DROP FUNCTION IF EXISTS NUMBER_OF_SETS;
    DELIMITER ;;
    CREATE FUNCTION NUMBER_OF_SETS(score TEXT)
    RETURNS INT
    DETERMINISTIC
    BEGIN
        DECLARE working TEXT;
        DECLARE token TEXT;
        DECLARE pos INT;
        DECLARE total_sets INT DEFAULT 0;

        IF score IS NULL THEN
            RETURN NULL;
        END IF;

        IF TRIM(score) = '' THEN
            RETURN 0;
        END IF;

        SET working = UPPER(TRIM(score));

        IF working REGEXP '(^|[[:space:]])(RET|RET''D|RETD|W/O|WO|WALKOVER|DEF|ABD)($|[[:space:]])' THEN
            RETURN 0;
        END IF;

        SET working = REGEXP_REPLACE(working, '[[:space:]]+', ' ');

        WHILE working <> '' DO
            SET pos = LOCATE(' ', working);

            IF pos = 0 THEN
                SET token = working;
                SET working = '';
            ELSE
                SET token = LEFT(working, pos - 1);
                SET working = TRIM(SUBSTRING(working, pos + 1));
            END IF;

            IF token NOT REGEXP '^\\[(0|15|30|40|A)-(0|15|30|40|A)\\]$' THEN
                IF NOT (
                    token REGEXP '^[0-9]+-[0-9]+$' OR
                    token REGEXP '^[0-9]+-[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)-[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)[0-9]+$' OR
                    token REGEXP '^[0-9]{2,4}$'
                ) THEN
                    RETURN NULL;
                END IF;

                SET total_sets = total_sets + 1;
            END IF;
        END WHILE;

        IF total_sets = 0 THEN
            RETURN NULL;
        END IF;

        RETURN total_sets;
    END;;
    DELIMITER ;

    DROP FUNCTION IF EXISTS NUMBER_OF_TIE_BREAKS;
    DELIMITER ;;
    CREATE FUNCTION NUMBER_OF_TIE_BREAKS(score TEXT)
    RETURNS INT
    DETERMINISTIC
    BEGIN
        DECLARE working TEXT;
        DECLARE token TEXT;
        DECLARE pos INT;
        DECLARE total_tie_breaks INT DEFAULT 0;
        DECLARE set_count INT DEFAULT 0;

        IF score IS NULL THEN
            RETURN NULL;
        END IF;

        IF TRIM(score) = '' THEN
            RETURN 0;
        END IF;

        SET working = UPPER(TRIM(score));

        IF working REGEXP '(^|[[:space:]])(RET|RET''D|RETD|W/O|WO|WALKOVER|DEF|ABD)($|[[:space:]])' THEN
            RETURN 0;
        END IF;

        SET working = REGEXP_REPLACE(working, '[[:space:]]+', ' ');

        WHILE working <> '' DO
            SET pos = LOCATE(' ', working);

            IF pos = 0 THEN
                SET token = working;
                SET working = '';
            ELSE
                SET token = LEFT(working, pos - 1);
                SET working = TRIM(SUBSTRING(working, pos + 1));
            END IF;

            IF token NOT REGEXP '^\\[(0|15|30|40|A)-(0|15|30|40|A)\\]$' THEN
                IF NOT (
                    token REGEXP '^[0-9]+-[0-9]+$' OR
                    token REGEXP '^[0-9]+-[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)-[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)[0-9]+$' OR
                    token REGEXP '^[0-9]{2,4}$'
                ) THEN
                    RETURN NULL;
                END IF;

                SET set_count = set_count + 1;

                IF token REGEXP '\\([0-9]+\\)' THEN
                    SET total_tie_breaks = total_tie_breaks + 1;
                END IF;
            END IF;
        END WHILE;

        IF set_count = 0 THEN
            RETURN NULL;
        END IF;

        RETURN total_tie_breaks;
    END;;
    DELIMITER ;
*/
