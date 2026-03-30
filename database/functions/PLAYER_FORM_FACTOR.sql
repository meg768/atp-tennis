DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_FORM_FACTOR`;;

CREATE FUNCTION `PLAYER_FORM_FACTOR` (playerID VARCHAR(32), weeks INT) RETURNS DECIMAL(10, 4) DETERMINISTIC
BEGIN
/*
PLAYER_FORM_FACTOR(playerID, weeks)

Purpose
- Return one numeric form signal in the range 0..1 for a single player.
- Higher means stronger recent form, lower means weaker recent form.
- 0.5 is intentionally treated as neutral.

Why this is a function
- It returns one scalar value.
- It is intended to be usable inside regular SQL queries.
- Example usage:
SELECT PLAYER_FORM_FACTOR('S0AG', 8);
SELECT id, name, PLAYER_FORM_FACTOR(id, 8) AS form_factor FROM players;

High-level model
1. Look only at completed matches for the player.
2. Ignore matches without a known event date.
3. Restrict the sample to the last N weeks.
4. Weight newer matches higher than older matches inside that window.
5. Shrink the result toward 0.5 so tiny samples do not look too extreme.

Why this exists
- A plain recent win rate is too jumpy.
- A player who wins 2-3 recent matches should not instantly look like "full form".
- Newer matches should matter more than older matches.

Exact weighting choice
- match_weight = POW(0.5, days_ago / window_days)
- window_days = weeks * 7

Interpretation of the weighting
- A match played today has weight 1.0.
- A match at the edge of the window has weight about 0.5.
- Matches halfway back in the window have weight about sqrt(0.5) ~= 0.707.
- This is a gentle recency bias, not an aggressive one.

Exact smoothing choice
- form_factor = (weighted_wins + 8) / (weighted_matches + 16)

Interpretation of the smoothing
- This is equivalent to a neutral prior of 16 weighted matches at 50/50.
- No matches in the window returns 0.5.
- Small samples stay close to 0.5.
- Larger samples gradually dominate the prior.

Why 16/8 was chosen
- Earlier, weaker smoothing made 2-3 recent wins look too strong.
- This heavier prior keeps the metric conservative.
- The goal is not to maximize reactivity, but to avoid overconfidence.

Inputs and edge cases
- Invalid playerID => NULL
- weeks <= 0 => NULL
- Unknown playerID => NULL
- Valid player with no matches in the window => 0.5000

Things you may want to tune later
- Recency curve:
change POW(0.5, ...) to another decay function
- Window behavior:
use more or fewer weeks
- Prior strength:
replace +8 / +16 with something lighter or heavier
- Match filtering:
add surface, tournament level, opponent strength, or minimum-match rules

Non-goals in the current version
- No opponent-strength adjustment
- No surface-specific adjustment
- No tournament-importance adjustment
- No explicit cap/minimum-sample threshold beyond the neutral prior
*/

DECLARE v_weighted_matches DECIMAL(12, 6) DEFAULT 0;

DECLARE v_weighted_wins DECIMAL(12, 6) DEFAULT 0;

DECLARE v_window_days DECIMAL(12, 6) DEFAULT 0;

IF playerID IS NULL
OR TRIM(playerID) = ''
OR weeks IS NULL
OR weeks <= 0 THEN RETURN NULL;

ELSEIF NOT EXISTS (
    SELECT
        1
    FROM
        players
    WHERE
        id = playerID
) THEN RETURN NULL;

END IF;

SET
    v_window_days = weeks * 7;

SELECT
    COALESCE(SUM(match_weight), 0) AS weighted_matches,
    COALESCE(
        SUM(
            CASE
                WHEN is_win = 1 THEN match_weight
                ELSE 0
            END
        ),
        0
    ) AS weighted_wins INTO v_weighted_matches,
    v_weighted_wins
FROM
    (
        SELECT
            CASE
                WHEN m.winner = playerID THEN 1
                ELSE 0
            END AS is_win,
            POW(0.5, GREATEST(DATEDIFF(CURDATE(), e.date), 0) / v_window_days) AS match_weight
        FROM
            matches m
            JOIN events e ON e.id = m.event
        WHERE
            m.status = 'Completed'
            AND e.date IS NOT NULL
            AND e.date >= DATE_SUB(CURDATE(), INTERVAL weeks WEEK)
            AND (
                m.winner = playerID
                OR m.loser = playerID
            )
    ) recent_matches;

/* Conservative neutral prior: 16 weighted matches at 50/50.
This keeps tiny samples from looking like "full form" too early. */
RETURN ROUND((v_weighted_wins + 8) / (v_weighted_matches + 16), 4);

END;;

DELIMITER ;
