-- Create syntax for TABLE 'events'
CREATE TABLE `events` (
  `id` varchar(20) NOT NULL DEFAULT '' COMMENT 'Unique ID',
  `date` date DEFAULT NULL COMMENT 'Start of event',
  `name` varchar(50) DEFAULT NULL COMMENT 'Name of event',
  `location` varchar(50) DEFAULT NULL COMMENT 'Country',
  `type` varchar(50) DEFAULT NULL COMMENT 'Typically ''Grand Slam'', ''Masters'', ''ATP-500'', ''ATP-250''',
  `surface` varchar(50) DEFAULT NULL COMMENT 'Typically ''Hard'', ''Clay'', ''Grass''',
  `url` varchar(100) DEFAULT NULL COMMENT 'URL to atptour.com',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for VIEW 'flatly'
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `flatly`
AS SELECT
   `matches`.`id` AS `id`,
   `C`.`date` AS `event_date`,
   `C`.`id` AS `event_id`,
   `C`.`name` AS `event_name`,
   `C`.`location` AS `event_location`,
   `C`.`type` AS `event_type`,
   `C`.`surface` AS `event_surface`,
   `matches`.`round` AS `round`,
   `A`.`name` AS `winner`,
   `B`.`name` AS `loser`,
   `A`.`id` AS `winner_id`,
   `matches`.`winner_rank` AS `winner_rank`,
   `B`.`id` AS `loser_id`,
   `matches`.`loser_rank` AS `loser_rank`,
   `matches`.`score` AS `score`,
   `matches`.`status` AS `status`,
   `matches`.`duration` AS `duration`
FROM (((`matches` left join `players` `A` on(`matches`.`winner` = `A`.`id`)) left join `players` `B` on(`matches`.`loser` = `B`.`id`)) left join `events` `C` on(`matches`.`event` = `C`.`id`)) order by `C`.`date`;

-- Create syntax for TABLE 'log'
CREATE TABLE `log` (
  `timestamp` datetime DEFAULT current_timestamp(),
  `message` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for TABLE 'matches'
CREATE TABLE `matches` (
  `id` varchar(50) NOT NULL DEFAULT '',
  `event` varchar(50) DEFAULT NULL COMMENT 'ID of event',
  `round` varchar(50) DEFAULT 'NUL' COMMENT 'Typically ''F'', ''SF'', ''QF'', ''R16'', ''R32'', ''R128''',
  `winner` varchar(50) DEFAULT NULL COMMENT 'ID of winner',
  `loser` varchar(50) DEFAULT NULL COMMENT 'ID of loser',
  `winner_rank` int(11) DEFAULT NULL COMMENT 'Winner current rank',
  `loser_rank` int(11) DEFAULT NULL COMMENT 'Loser current rank',
  `score` varchar(50) DEFAULT NULL COMMENT 'Final score - example ''7-6(5) 3-6 6-3 6-4''',
  `status` enum('Completed','Aborted','Walkover','Unknown') DEFAULT NULL COMMENT 'Status of match',
  `duration` varchar(50) DEFAULT NULL COMMENT 'Duration of the match in format H:MM',
  PRIMARY KEY (`id`),
  KEY `events` (`event`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for TABLE 'players'
CREATE TABLE `players` (
  `id` varchar(32) NOT NULL DEFAULT '' COMMENT 'Unique ID',
  `name` varchar(64) DEFAULT NULL COMMENT 'Full name',
  `country` varchar(16) DEFAULT NULL COMMENT 'Country code',
  `age` int(11) DEFAULT NULL COMMENT 'Age',
  `birthdate` date DEFAULT NULL COMMENT 'Date of birth',
  `pro` int(11) DEFAULT NULL COMMENT 'Year turned professional',
  `active` tinyint(1) DEFAULT NULL COMMENT 'Currently active',
  `height` int(11) DEFAULT NULL COMMENT 'Height in cm',
  `weight` int(11) DEFAULT NULL COMMENT 'Weight in kg',
  `rank` int(11) DEFAULT NULL COMMENT 'Current rank',
  `highest_rank` int(11) DEFAULT NULL COMMENT 'Highest rank',
  `highest_rank_date` date DEFAULT NULL COMMENT 'Highest rank date',
  `career_wins` int(11) DEFAULT NULL COMMENT 'Career wins',
  `career_losses` int(11) DEFAULT NULL COMMENT 'Career losses',
  `career_titles` int(11) DEFAULT NULL COMMENT 'Career titles',
  `career_prize` int(11) DEFAULT NULL COMMENT 'Career prize money',
  `ytd_wins` int(11) DEFAULT NULL COMMENT 'YTD wins',
  `ytd_losses` int(11) DEFAULT NULL COMMENT 'YTD losses',
  `ytd_titles` int(11) DEFAULT NULL COMMENT 'YTD titles',
  `ytd_prize` int(11) DEFAULT NULL COMMENT 'YTD prize money',
  `coach` varchar(100) DEFAULT NULL COMMENT 'Name of current coach',
  `points` int(11) DEFAULT NULL COMMENT 'ATP ranking points',
  `serve_rating` double DEFAULT NULL COMMENT 'ATP Serve rating (52 weeks)',
  `return_rating` double DEFAULT NULL COMMENT 'ATP Return rating (52 weeka)',
  `pressure_rating` double DEFAULT NULL COMMENT 'ATP Under pressure rating (52 weeks)',
  `elo_rank` int(11) DEFAULT NULL,
  `elo_rank_clay` int(11) DEFAULT NULL,
  `elo_rank_grass` int(11) DEFAULT NULL,
  `elo_rank_hard` int(11) DEFAULT NULL,
  `hard_factor` int(11) DEFAULT NULL COMMENT 'Performance on hardcourt (0-100)',
  `clay_factor` int(11) DEFAULT NULL COMMENT 'Performance on clay (0-100)',
  `grass_factor` int(11) DEFAULT NULL COMMENT 'Performance on grass (0-100)',
  `url` varchar(100) DEFAULT NULL COMMENT 'URL to ATP home page',
  `wikipedia` varchar(100) DEFAULT NULL COMMENT 'URL to Wikipedia',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for TABLE 'settings'
CREATE TABLE `settings` (
  `key` varchar(100) NOT NULL DEFAULT '',
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for FUNCTION 'NUMBER_OF_GAMES'
CREATE DEFINER=`root`@`%` FUNCTION `NUMBER_OF_GAMES`(score TEXT) RETURNS int(11)
    DETERMINISTIC
BEGIN

/*
NUMBER_OF_GAMES(score)

Purpose
- Return the total number of games in a tennis score string.

Expected score format
- Space-separated set scores
- Each set must look like:
  6-4
  7-6(5)
  6-7(8)

Examples
- '6-4 6-4' => 22
- '7-6(5) 3-6 6-3' => 31

Rules
- Tie-break points inside parentheses are ignored.
- Only the game counts on each side of the set are summed.
- Extra whitespace is normalized before parsing.

Edge cases
- NULL input => NULL
- Empty string => 0
- Invalid token anywhere in the score => NULL
- No valid sets parsed => NULL

Why this is strict
- It is intended as a helper for repo-controlled ATP score strings.
- Returning NULL on malformed input is safer than guessing.
*/

    DECLARE working TEXT;
    DECLARE token TEXT;
    DECLARE pos INT;
    DECLARE total_games INT DEFAULT 0;
    DECLARE set_count INT DEFAULT 0;
    DECLARE cleaned_token TEXT;
    DECLARE left_games INT;
    DECLARE right_games INT;

    IF score IS NULL THEN
        RETURN NULL;
    END IF;

    SET working = TRIM(score);

    IF working = '' THEN
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

        IF token NOT REGEXP '^[0-9]+-[0-9]+(\\([0-9]+\\))?$' THEN
            RETURN NULL;
        END IF;

        SET cleaned_token = REGEXP_REPLACE(token, '\\([0-9]+\\)$', '');
        SET left_games = CAST(SUBSTRING_INDEX(cleaned_token, '-', 1) AS UNSIGNED);
        SET right_games = CAST(SUBSTRING_INDEX(cleaned_token, '-', -1) AS UNSIGNED);

        SET total_games = total_games + left_games + right_games;
        SET set_count = set_count + 1;
    END WHILE;

    IF set_count = 0 THEN
        RETURN NULL;
    END IF;

    RETURN total_games;
END;

-- Create syntax for FUNCTION 'NUMBER_OF_SETS'
CREATE DEFINER=`root`@`%` FUNCTION `NUMBER_OF_SETS`(score TEXT) RETURNS int(11)
    DETERMINISTIC
BEGIN
    /*
    NUMBER_OF_SETS(score)

    Purpose
    - Return the number of sets in a tennis score string.

    Expected score format
    - Space-separated set scores
    - Each set must look like:
      6-4
      7-6(5)
      6-7(8)

    Examples
    - '6-4 6-4' => 2
    - '7-6(5) 3-6 6-3' => 3

    Rules
    - Each valid set token counts as one set.
    - Tie-break points inside parentheses do not change the set count.
    - Extra whitespace is normalized before parsing.

    Edge cases
    - NULL input => NULL
    - Empty string => 0
    - Invalid token anywhere in the score => NULL
    - No valid sets parsed => NULL

    Why this is strict
    - It is intended as a helper for repo-controlled ATP score strings.
    - Returning NULL on malformed input is safer than guessing.
    */

    DECLARE working TEXT;
    DECLARE token TEXT;
    DECLARE pos INT;
    DECLARE total_sets INT DEFAULT 0;

    IF score IS NULL THEN
        RETURN NULL;
    END IF;

    SET working = TRIM(score);

    IF working = '' THEN
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

        IF token NOT REGEXP '^[0-9]+-[0-9]+(\\([0-9]+\\))?$' THEN
            RETURN NULL;
        END IF;

        SET total_sets = total_sets + 1;
    END WHILE;

    IF total_sets = 0 THEN
        RETURN NULL;
    END IF;

    RETURN total_sets;
END;

-- Create syntax for FUNCTION 'NUMBER_OF_TIE_BREAKS'
CREATE DEFINER=`root`@`%` FUNCTION `NUMBER_OF_TIE_BREAKS`(score TEXT) RETURNS int(11)
    DETERMINISTIC
BEGIN
    /*
    NUMBER_OF_TIE_BREAKS(score)

    Purpose
    - Return how many sets in a tennis score string were decided by tie-break.

    Expected score format
    - Space-separated set scores
    - Each set must look like:
      6-4
      7-6(5)
      6-7(8)

    Examples
    - '6-4 6-4' => 0
    - '7-6(5) 3-6 6-3' => 1
    - '7-6(4) 6-7(8) 7-6(6)' => 3

    Rules
    - A set counts as a tie-break set when it ends with '(...)'.
    - The number inside the parentheses is not interpreted further.
    - Extra whitespace is normalized before parsing.

    Edge cases
    - NULL input => NULL
    - Empty string => 0
    - Invalid token anywhere in the score => NULL
    - No valid sets parsed => NULL

    Why this is strict
    - It is intended as a helper for repo-controlled ATP score strings.
    - Returning NULL on malformed input is safer than guessing.
    */

    DECLARE working TEXT;
    DECLARE token TEXT;
    DECLARE pos INT;
    DECLARE total_tie_breaks INT DEFAULT 0;
    DECLARE set_count INT DEFAULT 0;

    IF score IS NULL THEN
        RETURN NULL;
    END IF;

    SET working = TRIM(score);

    IF working = '' THEN
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

        IF token NOT REGEXP '^[0-9]+-[0-9]+(\\([0-9]+\\))?$' THEN
            RETURN NULL;
        END IF;

        SET set_count = set_count + 1;

        IF token REGEXP '\\([0-9]+\\)$' THEN
            SET total_tie_breaks = total_tie_breaks + 1;
        END IF;
    END WHILE;

    IF set_count = 0 THEN
        RETURN NULL;
    END IF;

    RETURN total_tie_breaks;
END;

-- Create syntax for FUNCTION 'PLAYER_LOOKUP'
CREATE DEFINER=`root`@`%` FUNCTION `PLAYER_LOOKUP`(searchTerm VARCHAR(255)
) RETURNS varchar(32) CHARSET utf8mb4 COLLATE utf8mb4_general_ci
    DETERMINISTIC
BEGIN
    /*
    PLAYER_LOOKUP(searchTerm)

    Purpose
    - Return the best matching player id for a search term.
    - This follows the same matching and ranking rules as `PLAYER_SEARCH`.

    Input
    - searchTerm:
      ATP player id or free-text player name

    Output
    - Best matching `players.id`
    - `NULL` when no match is found

    Matching rules
    - Exact player id match first
    - Exact player name match second
    - Exact last name match third
    - Prefix name match fourth
    - Broader contains match fifth

    Ordering
    - Best match_score first
    - Active players before inactive players
    - Ranked players before unranked players
    - Better ATP rank first
    - Name as final tiebreaker

    Validation
    - Empty searchTerm returns `NULL`

    Example usage
    - SELECT PLAYER_LOOKUP('S0AG');
    - SELECT PLAYER_LOOKUP('Sinner');
    */

    DECLARE normalizedTerm VARCHAR(255) DEFAULT TRIM(COALESCE(searchTerm, ''));
    DECLARE prefixTerm VARCHAR(256);
    DECLARE containsTerm VARCHAR(257);
    DECLARE resultPlayerID VARCHAR(32) DEFAULT NULL;

    IF normalizedTerm = '' THEN
        RETURN NULL;
    END IF;

    SET prefixTerm = CONCAT(normalizedTerm, '%');
    SET containsTerm = CONCAT('%', normalizedTerm, '%');

    SELECT
        id
    INTO
        resultPlayerID
    FROM (
        SELECT
            id,
            name,
            country,
            rank,
            active,
            CASE
                WHEN UPPER(id) = UPPER(normalizedTerm) THEN 1
                WHEN LOWER(name) = LOWER(normalizedTerm) THEN 2
                WHEN LOWER(SUBSTRING_INDEX(name, ' ', -1)) = LOWER(normalizedTerm) THEN 3
                WHEN LOWER(name) LIKE LOWER(prefixTerm) THEN 4
                WHEN LOWER(name) LIKE LOWER(containsTerm) THEN 5
                ELSE 6
            END AS match_score
        FROM players
        WHERE
            UPPER(id) = UPPER(normalizedTerm)
            OR LOWER(name) = LOWER(normalizedTerm)
            OR LOWER(name) LIKE LOWER(prefixTerm)
            OR LOWER(name) LIKE LOWER(containsTerm)
        ORDER BY
            match_score ASC,
            (active = 1) DESC,
            (rank IS NULL) ASC,
            rank ASC,
            name ASC
        LIMIT 1
    ) ranked_candidates;

    RETURN resultPlayerID;
END;

-- Create syntax for PROCEDURE 'PLAYER_ODDS'
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `PLAYER_ODDS`(
    IN playerA VARCHAR(255),
    IN playerB VARCHAR(255),
    IN surface VARCHAR(50)
)
BEGIN
    /*
    PLAYER_ODDS(playerA, playerB, surface)

    Purpose
    - Return two rows of decimal odds for a matchup.
    - One row is returned per player.
    - The underlying win probability now comes from PLAYER_WIN_FACTOR(...),
      which is the single source of truth for the model.
    - A fixed 5% margin is then applied when converting fair probability to
      decimal odds.

    Inputs
    - playerA:
      ATP id or free-text player name for the first player
    - playerB:
      ATP id or free-text player name for the second player
    - surface:
      Optional surface selector such as 'Hard', 'Clay', or 'Grass'

    Output columns
    - player
    - name
    - odds

    Notes
    - Player inputs are resolved through PLAYER_LOOKUP(...)
    - The procedure returns an empty result set when either player cannot be
      resolved or when both resolve to the same player

    Example usage
    - CALL PLAYER_ODDS('Tien', 'Burruchaga', 'Clay');
    - CALL PLAYER_ODDS('T0HA', 'B0FV', 'Clay');
    */

    DECLARE resolvedPlayerA VARCHAR(32) DEFAULT NULL;
    DECLARE resolvedPlayerB VARCHAR(32) DEFAULT NULL;
    DECLARE normalizedSurface VARCHAR(50) DEFAULT NULL;
    DECLARE factorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE factorB DECIMAL(10,4) DEFAULT NULL;
    DECLARE pricedFactorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE pricedFactorB DECIMAL(10,4) DEFAULT NULL;

    SET resolvedPlayerA = PLAYER_LOOKUP(playerA);
    SET resolvedPlayerB = PLAYER_LOOKUP(playerB);
    SET normalizedSurface = NULLIF(TRIM(surface), '');

    IF resolvedPlayerA IS NULL
        OR resolvedPlayerB IS NULL
        OR UPPER(resolvedPlayerA) = UPPER(resolvedPlayerB)
    THEN
        SELECT
            id AS player,
            name AS name,
            CAST(NULL AS DECIMAL(10,2)) AS odds
        FROM players
        WHERE 1 = 0;
    ELSE
        SET factorA = PLAYER_WIN_FACTOR(resolvedPlayerA, resolvedPlayerB, normalizedSurface);

        IF factorA IS NULL OR factorA <= 0 OR factorA >= 1 THEN
            SELECT
                id AS player,
                name AS name,
                CAST(NULL AS DECIMAL(10,2)) AS odds
            FROM players
            WHERE 1 = 0;
        ELSE
            SET factorB = 1 - factorA;
            SET pricedFactorA = factorA * 1.05;
            SET pricedFactorB = factorB * 1.05;

            IF factorB <= 0 OR factorB >= 1 THEN
                SELECT
                    id AS player,
                    name AS name,
                    CAST(NULL AS DECIMAL(10,2)) AS odds
                FROM players
                WHERE 1 = 0;
            ELSE
                SELECT
                    p.id AS player,
                    p.name AS name,
                    ROUND(1 / pricedFactorA, 2) AS odds
                FROM players p
                WHERE p.id = resolvedPlayerA

                UNION ALL

                SELECT
                    p.id AS player,
                    p.name AS name,
                    ROUND(1 / pricedFactorB, 2) AS odds
                FROM players p
                WHERE p.id = resolvedPlayerB;
            END IF;
        END IF;
    END IF;
END;;
DELIMITER ;

-- Create syntax for PROCEDURE 'PLAYER_SEARCH'
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `PLAYER_SEARCH`(
    IN searchTerm VARCHAR(255)
)
BEGIN
    /*
    PLAYER_SEARCH(searchTerm)

    Purpose
    - Return a ranked list of player candidates for a search term.
    - This is the primary lookup/search interface for player-name resolution.

    Input
    - searchTerm:
      ATP player id or free-text player name

    Output columns
    - id
    - name
    - country
    - rank
    - active
    - At most 5 rows

    Matching rules
    - Exact player id match first
    - Exact player name match second
    - Exact last name match third
    - Prefix name match fourth
    - Broader contains match fifth

    Ordering
    - Best match_score first
    - Active players before inactive players
    - Ranked players before unranked players
    - Better ATP rank first
    - Name as final tiebreaker

    Validation
    - Empty searchTerm returns an empty result set

    Example usage
    - CALL PLAYER_SEARCH('S0AG');
    - CALL PLAYER_SEARCH('Sinner');
    */

    DECLARE normalizedTerm VARCHAR(255) DEFAULT TRIM(COALESCE(searchTerm, ''));
    DECLARE prefixTerm VARCHAR(256);
    DECLARE containsTerm VARCHAR(257);

    IF normalizedTerm = '' THEN
        SELECT
            id,
            name,
            country,
            rank,
            active
        FROM players
        WHERE 1 = 0;
    ELSE
        SET prefixTerm = CONCAT(normalizedTerm, '%');
        SET containsTerm = CONCAT('%', normalizedTerm, '%');

        SELECT
            id,
            name,
            country,
            rank,
            active
        FROM (
            SELECT
                id,
                name,
                country,
                rank,
                active,
                CASE
                    WHEN UPPER(id) = UPPER(normalizedTerm) THEN 1
                    WHEN LOWER(name) = LOWER(normalizedTerm) THEN 2
                    WHEN LOWER(SUBSTRING_INDEX(name, ' ', -1)) = LOWER(normalizedTerm) THEN 3
                    WHEN LOWER(name) LIKE LOWER(prefixTerm) THEN 4
                    WHEN LOWER(name) LIKE LOWER(containsTerm) THEN 5
                    ELSE 6
                END AS match_score
            FROM players
            WHERE
                UPPER(id) = UPPER(normalizedTerm)
                OR LOWER(name) = LOWER(normalizedTerm)
                OR LOWER(name) LIKE LOWER(prefixTerm)
                OR LOWER(name) LIKE LOWER(containsTerm)
        ) ranked_candidates
        WHERE
            1 = 1
        ORDER BY
            match_score ASC,
            (active = 1) DESC,
            (rank IS NULL) ASC,
            rank ASC,
            name ASC
        LIMIT 5;
    END IF;
END;;
DELIMITER ;

-- Create syntax for FUNCTION 'PLAYER_WIN_FACTOR'
CREATE DEFINER=`root`@`%` FUNCTION `PLAYER_WIN_FACTOR`(playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS decimal(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_WIN_FACTOR(playerID, opponentID, surface)

    Purpose
    - Return the win probability for playerID against opponentID.
    - This version is organized into named model factors.
    - Higher return value means playerID is more likely to win.
    - 0.5 is neutral.

    Design goals
    - Keep this function self-contained so the full win-factor model can be
      understood from the SQL definition alone.
    - Keep this function separate from older PLAYER_*_FACTOR helpers.
    - Build the model gradually by starting from Elo and adding small,
      explicitly weighted adjustments.
    - Document each factor with its own name, criteria, and weight.
    - Express each extra factor as an Elo-point adjustment instead of mixing
      together several independent probabilities.

    Current model
    1. Start from the Elo factor.
    2. Add any enabled adjustment factors.
    3. Convert the adjusted Elo gap into win probability.

    Factor overview
    - Factor: Elo
      Weight: 50%
      Role: core model factor
    - Factor: Ranking
      Weight: 15%
      Role: stable quality adjustment factor
    - Factor: Head To Head
      Weight: 15%
      Role: small adjustment factor
    - Factor: Form
      Weight: 20%
      Role: recent performance adjustment factor

    Factor rules
    - Every factor must have:
      1. a name
      2. a purpose
      3. clear sample criteria
      4. a documented weight
      5. a documented inclusion or exclusion rule
    - The configured factor weights must sum to 100%.
    - The Elo factor is the base factor.
    - Additional factors should adjust or blend with the Elo gap, not replace it.
    - If a factor is excluded, the active factors are renormalized so the
      active model still sums to 100%.

    Factor: Elo
    Purpose
    - Use the players' rating difference as the main signal.

    Weight
    - 50%

    Criteria
    - Hard => use elo_rank_hard, falling back to elo_rank
    - Clay => use elo_rank_clay, falling back to elo_rank
    - Grass => use elo_rank_grass, falling back to elo_rank
    - NULL, empty, or any other surface => use elo_rank

    Interpretation
    - The Elo gap is the primary driver of the probability.
    - Positive gap favors playerID.
    - Negative gap favors opponentID.
    - Other factors should only nudge this gap.

    Factor: Ranking
    Purpose
    - Add a stable quality adjustment based on current ATP ranking.

    Weight
    - 15%

    Raw factor scale
    - 100 Elo points
    - At 15% weight, the maximum effect is +/-15 Elo points

    Criteria
    - Use the current ATP rank from the players table.
    - Lower ranking number is better.
    - Use all surfaces.

    Formula
    - rank_score = LN(rank_opponent) - LN(rank_player)
    - rank_factor = 1 / (1 + EXP(-rank_score))
    - rank_edge = (rank_factor - 0.5) * 2
    - rank_raw_gap = rank_edge * 100

    Interpretation
    - This gives a modest edge to the better-ranked player.
    - The log transform makes top-of-the-ranking gaps matter more than the
      same absolute gap lower down the list.

    Inclusion rule
    - If either player has a missing or non-positive ATP rank, the Ranking
      factor is excluded entirely.

    Factor: Head To Head
    Purpose
    - Add a small adjustment when the two players have already faced each
      other recently.

    Weight
    - 15%

    Raw factor scale
    - 100 Elo points
    - At 15% weight, the maximum effect is +/-15 Elo points

    Criteria
    - Look only at completed matches between the two players.
    - Ignore matches without a known event date.
    - Restrict the sample to the last 2 years.
    - If surface is provided, only use matches on that surface.
    - If surface is NULL or empty, use all surfaces.

    Smoothing
    - h2h_factor = (wins_player + 1) / (matches + 2)
    - No matches => 0.5
    - 1-0 => 0.6667
    - 0-1 => 0.3333

    Inclusion rule
    - If the players have no qualifying head-to-head matches in the sample,
      the head-to-head factor is excluded entirely.
    - In that case the model uses the pure Elo gap with no head-to-head
      adjustment.

    Factor: Form
    Purpose
    - Add a small adjustment based on recent match results.

    Weight
    - 20%

    Raw factor scale
    - 100 Elo points
    - At 20% weight, the maximum effect is +/-20 Elo points

    Criteria
    - Look only at completed matches for each player separately.
    - Ignore matches without a known event date.
    - Restrict the sample to the last 8 weeks.
    - Use all surfaces.
    - Weight newer matches higher than older matches.

    Recency weighting
    - match_weight = POW(0.5, days_ago / window_days)
    - window_days = 8 * 7
    - A match today has weight 1.0
    - A match at the edge of the window has weight about 0.5

    Smoothing
    - base_form_factor = (weighted_wins + 4) / (weighted_matches + 8)
    - No matches => 0.5
    - Small samples remain close to neutral

    Quality-of-results adjustment
    - The Form factor also rewards recent wins against better-ranked opponents.
    - It also penalizes recent losses against worse-ranked opponents.
    - "Better-ranked" means a lower ranking number.
    - Match-time ranks are taken from winner_rank and loser_rank in the matches
      table.
    - Only matches with positive known ranks contribute to the quality signal.
    - Upset wins and bad losses are scaled with a log transform and capped so
      one match cannot dominate the factor.

    Quality formula
    - per_match_quality_score:
      - positive for a win against a better-ranked opponent
      - negative for a loss against a worse-ranked opponent
      - zero otherwise
    - quality_factor = 0.5 + 0.5 * (weighted_quality_score / (weighted_matches + 2))
    - quality_factor is clamped to the range 0.0..1.0

    Set-dominance adjustment
    - The Form factor also rewards more decisive recent match results.
    - Straight-set wins are worth more than narrow wins.
    - Straight-set losses are worse than narrow losses.
    - The score string is parsed through NUMBER_OF_SETS(score).
    - The dominance signal uses completed match scores with 2 to 5 sets.

    Set-dominance formula
    - For best-of-3 style results:
      - 2-0 win => +1.0000
      - 2-1 win => +0.5000
      - 1-2 loss => -0.5000
      - 0-2 loss => -1.0000
    - For best-of-5 style results:
      - 3-0 win => +1.0000
      - 3-1 win => +0.6667
      - 3-2 win => +0.3333
      - 2-3 loss => -0.3333
      - 1-3 loss => -0.6667
      - 0-3 loss => -1.0000
    - dominance_factor = 0.5 + 0.5 * (weighted_dominance_score / (weighted_matches + 2))
    - dominance_factor is clamped to the range 0.0..1.0

    Form blend
    - final_form_factor =
      (base_form_factor * 60%)
      + (quality_factor * 25%)
      + (dominance_factor * 15%)

    Inclusion rule
    - If neither player has any qualifying recent matches in the sample,
      the Form factor is excluded entirely.
    - If the resulting form edge is neutral, the Form factor is also excluded.
    - Otherwise the Form factor is included.

    Exact formula
    - elo_raw_gap = elo_player - elo_opponent
    - rank_score = LN(rank_opponent) - LN(rank_player)
    - rank_factor = 1 / (1 + EXP(-rank_score))
    - rank_edge = (rank_factor - 0.5) * 2
    - rank_raw_gap = rank_edge * 100
    - h2h_edge = (h2h_factor - 0.5) * 2
    - h2h_raw_gap = h2h_edge * 100
    - form_edge = final_form_factor_player - final_form_factor_opponent
    - form_raw_gap = form_edge * 100
    - weighted_gap_sum =
      (elo_raw_gap * 50)
      + (rank_raw_gap * 15 if included)
      + (h2h_raw_gap * 15 if included)
      + (form_raw_gap * 20 if included)
    - active_weight_sum = sum of active factor weights
    - adjusted_gap = weighted_gap_sum / active_weight_sum
    - probability = 1 / (1 + POW(10, -adjusted_gap / 400))

    Inputs and edge cases
    - Invalid playerID => NULL
    - Invalid opponentID => NULL
    - Same player and opponent => NULL
    - Missing usable Elo on either side => NULL

    Maintenance note
    - When adding a new factor later, document all of the following inside this
      function:
      1. Factor name
      2. Why the factor exists
      3. Factor weight
      4. What sample or data it uses
      5. How it is smoothed or capped
      6. How it modifies the Elo gap
      7. When it is excluded from the model
    - Keep this documentation inside the function so the model remains
      understandable from a SQL dump alone.
    */

    DECLARE v_surface VARCHAR(50) DEFAULT NULL;
    DECLARE v_elo_player DOUBLE DEFAULT NULL;
    DECLARE v_elo_opponent DOUBLE DEFAULT NULL;
    DECLARE v_elo_factor_weight DOUBLE DEFAULT 50;
    DECLARE v_rank_factor_weight DOUBLE DEFAULT 15;
    DECLARE v_rank_factor_raw_elo DOUBLE DEFAULT 100;
    DECLARE v_h2h_factor_weight DOUBLE DEFAULT 15;
    DECLARE v_h2h_factor_raw_elo DOUBLE DEFAULT 100;
    DECLARE v_form_factor_weight DOUBLE DEFAULT 20;
    DECLARE v_form_factor_raw_elo DOUBLE DEFAULT 100;
    DECLARE v_rank_player INT DEFAULT NULL;
    DECLARE v_rank_opponent INT DEFAULT NULL;
    DECLARE v_rank_score DOUBLE DEFAULT 0;
    DECLARE v_rank_factor_value DOUBLE DEFAULT 0.5;
    DECLARE v_rank_edge DOUBLE DEFAULT 0;
    DECLARE v_rank_raw_gap DOUBLE DEFAULT 0;
    DECLARE v_include_rank TINYINT(1) DEFAULT 0;
    DECLARE v_h2h_matches INT DEFAULT 0;
    DECLARE v_h2h_wins_player INT DEFAULT 0;
    DECLARE v_h2h_factor DOUBLE DEFAULT 0.5;
    DECLARE v_h2h_edge DOUBLE DEFAULT 0;
    DECLARE v_h2h_raw_gap DOUBLE DEFAULT 0;
    DECLARE v_include_h2h TINYINT(1) DEFAULT 0;
    DECLARE v_form_weeks INT DEFAULT 8;
    DECLARE v_form_window_days DOUBLE DEFAULT 0;
    DECLARE v_form_matches_player DOUBLE DEFAULT 0;
    DECLARE v_form_wins_player DOUBLE DEFAULT 0;
    DECLARE v_form_matches_opponent DOUBLE DEFAULT 0;
    DECLARE v_form_wins_opponent DOUBLE DEFAULT 0;
    DECLARE v_form_quality_score_player DOUBLE DEFAULT 0;
    DECLARE v_form_quality_score_opponent DOUBLE DEFAULT 0;
    DECLARE v_form_dominance_score_player DOUBLE DEFAULT 0;
    DECLARE v_form_dominance_score_opponent DOUBLE DEFAULT 0;
    DECLARE v_form_base_weight DOUBLE DEFAULT 0.60;
    DECLARE v_form_quality_weight DOUBLE DEFAULT 0.25;
    DECLARE v_form_dominance_weight DOUBLE DEFAULT 0.15;
    DECLARE v_form_factor_player DOUBLE DEFAULT 0.5;
    DECLARE v_form_factor_opponent DOUBLE DEFAULT 0.5;
    DECLARE v_form_base_factor_player DOUBLE DEFAULT 0.5;
    DECLARE v_form_base_factor_opponent DOUBLE DEFAULT 0.5;
    DECLARE v_form_quality_factor_player DOUBLE DEFAULT 0.5;
    DECLARE v_form_quality_factor_opponent DOUBLE DEFAULT 0.5;
    DECLARE v_form_dominance_factor_player DOUBLE DEFAULT 0.5;
    DECLARE v_form_dominance_factor_opponent DOUBLE DEFAULT 0.5;
    DECLARE v_form_edge DOUBLE DEFAULT 0;
    DECLARE v_form_raw_gap DOUBLE DEFAULT 0;
    DECLARE v_include_form TINYINT(1) DEFAULT 0;
    DECLARE v_elo_gap DOUBLE DEFAULT NULL;
    DECLARE v_weighted_gap_sum DOUBLE DEFAULT NULL;
    DECLARE v_active_weight_sum DOUBLE DEFAULT NULL;
    DECLARE v_adjusted_gap DOUBLE DEFAULT NULL;
    DECLARE v_probability DOUBLE DEFAULT NULL;

    IF playerID IS NULL OR TRIM(playerID) = '' OR opponentID IS NULL OR TRIM(opponentID) = '' THEN
        RETURN NULL;
    END IF;

    IF UPPER(playerID) = UPPER(opponentID) THEN
        RETURN NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM players WHERE id = playerID) THEN
        RETURN NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM players WHERE id = opponentID) THEN
        RETURN NULL;
    END IF;

    SET v_surface = UPPER(NULLIF(TRIM(surface), ''));
    SET v_form_window_days = v_form_weeks * 7;

    SELECT
        CASE
            WHEN v_surface = 'HARD' THEN COALESCE(elo_rank_hard, elo_rank)
            WHEN v_surface = 'CLAY' THEN COALESCE(elo_rank_clay, elo_rank)
            WHEN v_surface = 'GRASS' THEN COALESCE(elo_rank_grass, elo_rank)
            ELSE elo_rank
        END
    INTO v_elo_player
    FROM players
    WHERE id = playerID
    LIMIT 1;

    SELECT
        CASE
            WHEN v_surface = 'HARD' THEN COALESCE(elo_rank_hard, elo_rank)
            WHEN v_surface = 'CLAY' THEN COALESCE(elo_rank_clay, elo_rank)
            WHEN v_surface = 'GRASS' THEN COALESCE(elo_rank_grass, elo_rank)
            ELSE elo_rank
        END
    INTO v_elo_opponent
    FROM players
    WHERE id = opponentID
    LIMIT 1;

    IF v_elo_player IS NULL OR v_elo_opponent IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT rank INTO v_rank_player
    FROM players
    WHERE id = playerID
    LIMIT 1;

    SELECT rank INTO v_rank_opponent
    FROM players
    WHERE id = opponentID
    LIMIT 1;

    IF v_rank_player IS NOT NULL
        AND v_rank_player > 0
        AND v_rank_opponent IS NOT NULL
        AND v_rank_opponent > 0
    THEN
        SET v_include_rank = 1;
        SET v_rank_score = LN(v_rank_opponent) - LN(v_rank_player);
        SET v_rank_factor_value = 1 / (1 + EXP(-v_rank_score));
        SET v_rank_edge = (v_rank_factor_value - 0.5) * 2;
        SET v_rank_raw_gap = v_rank_edge * v_rank_factor_raw_elo;
    ELSE
        SET v_include_rank = 0;
        SET v_rank_score = 0;
        SET v_rank_factor_value = NULL;
        SET v_rank_edge = 0;
        SET v_rank_raw_gap = 0;
    END IF;

    SELECT
        COUNT(*) AS matches_played,
        COALESCE(SUM(CASE WHEN m.winner = playerID THEN 1 ELSE 0 END), 0) AS wins_player
    INTO
        v_h2h_matches,
        v_h2h_wins_player
    FROM matches m
    JOIN events e ON e.id = m.event
    WHERE
        m.status = 'Completed'
        AND e.date IS NOT NULL
        AND e.date >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR)
        AND (
            (m.winner = playerID AND m.loser = opponentID)
            OR
            (m.winner = opponentID AND m.loser = playerID)
        )
        AND (
            v_surface IS NULL
            OR e.surface = CONCAT(UCASE(LEFT(v_surface, 1)), LCASE(SUBSTRING(v_surface, 2)))
        );

    IF v_h2h_matches > 0 THEN
        SET v_include_h2h = 1;
        SET v_h2h_factor = (v_h2h_wins_player + 1) / (v_h2h_matches + 2);
        SET v_h2h_edge = (v_h2h_factor - 0.5) * 2;
        SET v_h2h_raw_gap = v_h2h_edge * v_h2h_factor_raw_elo;
    ELSE
        SET v_include_h2h = 0;
        SET v_h2h_factor = NULL;
        SET v_h2h_edge = 0;
        SET v_h2h_raw_gap = 0;
    END IF;

    SELECT
        COALESCE(SUM(match_weight), 0) AS weighted_matches,
        COALESCE(SUM(CASE WHEN is_win = 1 THEN match_weight ELSE 0 END), 0) AS weighted_wins,
        COALESCE(SUM(match_weight * quality_score), 0) AS weighted_quality_score,
        COALESCE(SUM(match_weight * dominance_score), 0) AS weighted_dominance_score
    INTO
        v_form_matches_player,
        v_form_wins_player,
        v_form_quality_score_player,
        v_form_dominance_score_player
    FROM (
        SELECT
            CASE WHEN m.winner = playerID THEN 1 ELSE 0 END AS is_win,
            POW(0.5, GREATEST(DATEDIFF(CURDATE(), e.date), 0) / v_form_window_days) AS match_weight,
            CASE
                WHEN m.winner = playerID
                    AND m.winner_rank IS NOT NULL
                    AND m.loser_rank IS NOT NULL
                    AND m.winner_rank > 0
                    AND m.loser_rank > 0
                    AND m.winner_rank > m.loser_rank
                THEN LEAST(1, (LN(m.winner_rank) - LN(m.loser_rank)) / LN(4))
                WHEN m.loser = playerID
                    AND m.winner_rank IS NOT NULL
                    AND m.loser_rank IS NOT NULL
                    AND m.winner_rank > 0
                    AND m.loser_rank > 0
                    AND m.loser_rank < m.winner_rank
                THEN -LEAST(1, (LN(m.winner_rank) - LN(m.loser_rank)) / LN(4))
                ELSE 0
            END AS quality_score,
            CASE
                WHEN NUMBER_OF_SETS(m.score) BETWEEN 2 AND 5 THEN
                    CASE
                        WHEN m.winner = playerID THEN
                            (
                                (
                                    CASE
                                        WHEN NUMBER_OF_SETS(m.score) <= 3 THEN 2
                                        ELSE 3
                                    END
                                ) - (
                                    NUMBER_OF_SETS(m.score) - (
                                        CASE
                                            WHEN NUMBER_OF_SETS(m.score) <= 3 THEN 2
                                            ELSE 3
                                        END
                                    )
                                )
                            ) / (
                                CASE
                                    WHEN NUMBER_OF_SETS(m.score) <= 3 THEN 2
                                    ELSE 3
                                END
                            )
                        WHEN m.loser = playerID THEN
                            -(
                                (
                                    (
                                        CASE
                                            WHEN NUMBER_OF_SETS(m.score) <= 3 THEN 2
                                            ELSE 3
                                        END
                                    ) - (
                                        NUMBER_OF_SETS(m.score) - (
                                            CASE
                                                WHEN NUMBER_OF_SETS(m.score) <= 3 THEN 2
                                                ELSE 3
                                            END
                                        )
                                    )
                                ) / (
                                    CASE
                                        WHEN NUMBER_OF_SETS(m.score) <= 3 THEN 2
                                        ELSE 3
                                    END
                                )
                            )
                        ELSE 0
                    END
                ELSE 0
            END AS dominance_score
        FROM matches m
        JOIN events e ON e.id = m.event
        WHERE
            m.status = 'Completed'
            AND e.date IS NOT NULL
            AND e.date >= DATE_SUB(CURDATE(), INTERVAL v_form_weeks WEEK)
            AND (m.winner = playerID OR m.loser = playerID)
    ) recent_player_matches;

    SELECT
        COALESCE(SUM(match_weight), 0) AS weighted_matches,
        COALESCE(SUM(CASE WHEN is_win = 1 THEN match_weight ELSE 0 END), 0) AS weighted_wins,
        COALESCE(SUM(match_weight * quality_score), 0) AS weighted_quality_score,
        COALESCE(SUM(match_weight * dominance_score), 0) AS weighted_dominance_score
    INTO
        v_form_matches_opponent,
        v_form_wins_opponent,
        v_form_quality_score_opponent,
        v_form_dominance_score_opponent
    FROM (
        SELECT
            CASE WHEN m.winner = opponentID THEN 1 ELSE 0 END AS is_win,
            POW(0.5, GREATEST(DATEDIFF(CURDATE(), e.date), 0) / v_form_window_days) AS match_weight,
            CASE
                WHEN m.winner = opponentID
                    AND m.winner_rank IS NOT NULL
                    AND m.loser_rank IS NOT NULL
                    AND m.winner_rank > 0
                    AND m.loser_rank > 0
                    AND m.winner_rank > m.loser_rank
                THEN LEAST(1, (LN(m.winner_rank) - LN(m.loser_rank)) / LN(4))
                WHEN m.loser = opponentID
                    AND m.winner_rank IS NOT NULL
                    AND m.loser_rank IS NOT NULL
                    AND m.winner_rank > 0
                    AND m.loser_rank > 0
                    AND m.loser_rank < m.winner_rank
                THEN -LEAST(1, (LN(m.winner_rank) - LN(m.loser_rank)) / LN(4))
                ELSE 0
            END AS quality_score,
            CASE
                WHEN NUMBER_OF_SETS(m.score) BETWEEN 2 AND 5 THEN
                    CASE
                        WHEN m.winner = opponentID THEN
                            (
                                (
                                    CASE
                                        WHEN NUMBER_OF_SETS(m.score) <= 3 THEN 2
                                        ELSE 3
                                    END
                                ) - (
                                    NUMBER_OF_SETS(m.score) - (
                                        CASE
                                            WHEN NUMBER_OF_SETS(m.score) <= 3 THEN 2
                                            ELSE 3
                                        END
                                    )
                                )
                            ) / (
                                CASE
                                    WHEN NUMBER_OF_SETS(m.score) <= 3 THEN 2
                                    ELSE 3
                                END
                            )
                        WHEN m.loser = opponentID THEN
                            -(
                                (
                                    (
                                        CASE
                                            WHEN NUMBER_OF_SETS(m.score) <= 3 THEN 2
                                            ELSE 3
                                        END
                                    ) - (
                                        NUMBER_OF_SETS(m.score) - (
                                            CASE
                                                WHEN NUMBER_OF_SETS(m.score) <= 3 THEN 2
                                                ELSE 3
                                            END
                                        )
                                    )
                                ) / (
                                    CASE
                                        WHEN NUMBER_OF_SETS(m.score) <= 3 THEN 2
                                        ELSE 3
                                    END
                                )
                            )
                        ELSE 0
                    END
                ELSE 0
            END AS dominance_score
        FROM matches m
        JOIN events e ON e.id = m.event
        WHERE
            m.status = 'Completed'
            AND e.date IS NOT NULL
            AND e.date >= DATE_SUB(CURDATE(), INTERVAL v_form_weeks WEEK)
            AND (m.winner = opponentID OR m.loser = opponentID)
    ) recent_opponent_matches;

    IF v_form_matches_player > 0 OR v_form_matches_opponent > 0 THEN
        SET v_form_base_factor_player = (v_form_wins_player + 4) / (v_form_matches_player + 8);
        SET v_form_base_factor_opponent = (v_form_wins_opponent + 4) / (v_form_matches_opponent + 8);
        SET v_form_quality_factor_player = 0.5 + 0.5 * (v_form_quality_score_player / (v_form_matches_player + 2));
        SET v_form_quality_factor_opponent = 0.5 + 0.5 * (v_form_quality_score_opponent / (v_form_matches_opponent + 2));
        SET v_form_dominance_factor_player = 0.5 + 0.5 * (v_form_dominance_score_player / (v_form_matches_player + 2));
        SET v_form_dominance_factor_opponent = 0.5 + 0.5 * (v_form_dominance_score_opponent / (v_form_matches_opponent + 2));
        SET v_form_quality_factor_player = GREATEST(0, LEAST(1, v_form_quality_factor_player));
        SET v_form_quality_factor_opponent = GREATEST(0, LEAST(1, v_form_quality_factor_opponent));
        SET v_form_dominance_factor_player = GREATEST(0, LEAST(1, v_form_dominance_factor_player));
        SET v_form_dominance_factor_opponent = GREATEST(0, LEAST(1, v_form_dominance_factor_opponent));
        SET v_form_factor_player = (v_form_base_factor_player * v_form_base_weight)
            + (v_form_quality_factor_player * v_form_quality_weight)
            + (v_form_dominance_factor_player * v_form_dominance_weight);
        SET v_form_factor_opponent = (v_form_base_factor_opponent * v_form_base_weight)
            + (v_form_quality_factor_opponent * v_form_quality_weight)
            + (v_form_dominance_factor_opponent * v_form_dominance_weight);
        SET v_form_edge = v_form_factor_player - v_form_factor_opponent;
        SET v_form_raw_gap = v_form_edge * v_form_factor_raw_elo;

        IF ABS(v_form_edge) < 0.0001 THEN
            SET v_include_form = 0;
            SET v_form_edge = 0;
            SET v_form_raw_gap = 0;
        ELSE
            SET v_include_form = 1;
        END IF;
    ELSE
        SET v_include_form = 0;
        SET v_form_factor_player = NULL;
        SET v_form_factor_opponent = NULL;
        SET v_form_base_factor_player = NULL;
        SET v_form_base_factor_opponent = NULL;
        SET v_form_quality_factor_player = NULL;
        SET v_form_quality_factor_opponent = NULL;
        SET v_form_dominance_factor_player = NULL;
        SET v_form_dominance_factor_opponent = NULL;
        SET v_form_edge = 0;
        SET v_form_raw_gap = 0;
    END IF;

    SET v_elo_gap = v_elo_player - v_elo_opponent;
    SET v_weighted_gap_sum = (v_elo_gap * v_elo_factor_weight)
        + (v_rank_raw_gap * v_rank_factor_weight * v_include_rank)
        + (v_h2h_raw_gap * v_h2h_factor_weight * v_include_h2h);
    SET v_weighted_gap_sum = v_weighted_gap_sum
        + (v_form_raw_gap * v_form_factor_weight * v_include_form);
    SET v_active_weight_sum = v_elo_factor_weight
        + (v_rank_factor_weight * v_include_rank)
        + (v_h2h_factor_weight * v_include_h2h);
    SET v_active_weight_sum = v_active_weight_sum
        + (v_form_factor_weight * v_include_form);
    SET v_adjusted_gap = v_weighted_gap_sum / v_active_weight_sum;
    SET v_probability = 1 / (1 + POW(10, -v_adjusted_gap / 400));

    RETURN ROUND(v_probability, 4);
END;