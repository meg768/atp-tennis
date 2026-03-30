DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_FATIGUE_FACTOR`;;

CREATE FUNCTION `PLAYER_FATIGUE_FACTOR`(
    playerID VARCHAR(32),
    weeks INT
) RETURNS DECIMAL(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_FATIGUE_FACTOR(playerID, weeks)

    Purpose
    - Return one numeric fatigue/restedness signal in the range 0..1 for a single player.
    - Higher means more rested.
    - Lower means more recent workload.

    Why this is a function
    - It returns one scalar value.
    - It is intended to be usable inside regular SQL queries.
    - Example usage:
      SELECT PLAYER_FATIGUE_FACTOR('S0AG', 1);
      SELECT id, name, PLAYER_FATIGUE_FACTOR(id, 1) AS fatigue_factor FROM players;

    High-level model
    1. Look only at completed matches for the player.
    2. Ignore matches without a known event date.
    3. Restrict the sample to the last N weeks.
    4. Weight newer matches higher than older matches inside that window.
    5. Estimate workload from the match itself:
       - every match adds a base load
       - extra sets add extra load
       - tie-break sets add a small extra load
    6. Convert total workload into a 0..1 restedness factor.

    Why this exists
    - Match congestion matters in tennis.
    - A player who has played several recent matches should usually be treated as a bit less fresh.
    - The workload signal should be simple, local, and deterministic.

    Exact weighting choice
    - match_weight = POW(0.5, days_ago / window_days)
    - window_days = weeks * 7

    Interpretation of the weighting
    - A match played today has weight 1.0.
    - A match at the edge of the window has weight about 0.5.
    - Newer workload matters more than older workload.

    Exact workload choice
    - match_load =
        match_weight *
        (
          1.0
          + 0.4 * extra_sets
          + 0.15 * tie_breaks
        )
    - extra_sets = GREATEST(NUMBER_OF_SETS(score) - 2, 0)
    - tie_breaks = NUMBER_OF_TIE_BREAKS(score)

    Interpretation of the workload
    - Every match adds a baseline workload.
    - Longer matches increase the load.
    - Tie-break-heavy matches increase the load a little more.

    Exact conversion to restedness
    - fatigue_factor = 1 / (1 + total_load / 4)

    Interpretation of the restedness scale
    - No recent matches => 1.0
    - One recent straight-sets match => still fairly rested
    - Several recent matches => lower value
    - This is intentionally a simple first version, not a physiology model

    Inputs and edge cases
    - Invalid playerID => NULL
    - weeks <= 0 => NULL
    - Unknown playerID => NULL
    - Valid player with no matches in the window => 1.0000

    Things you may want to tune later
    - Recency curve:
      change POW(0.5, ...) to another decay function
    - Window behavior:
      use more or fewer weeks
    - Workload weights:
      change base match load, extra set penalty, or tie-break penalty
    - Duration:
      add match duration if you want a stronger load signal
    - Travel:
      add travel or surface-switch penalties outside this function if needed

    Non-goals in the current version
    - No travel adjustment
    - No time-zone adjustment
    - No surface-switch adjustment
    - No direct use of match duration yet
    */

    DECLARE v_total_load DECIMAL(12,6) DEFAULT 0;
    DECLARE v_window_days DECIMAL(12,6) DEFAULT 0;

    IF playerID IS NULL OR TRIM(playerID) = '' OR weeks IS NULL OR weeks <= 0 THEN
        RETURN NULL;
    ELSEIF NOT EXISTS (
        SELECT 1
        FROM players
        WHERE id = playerID
    ) THEN
        RETURN NULL;
    END IF;

    SET v_window_days = weeks * 7;

    SELECT
        COALESCE(SUM(match_load), 0)
    INTO
        v_total_load
    FROM (
        SELECT
            POW(0.5, GREATEST(DATEDIFF(CURDATE(), e.date), 0) / v_window_days) *
            (
                1
                + 0.4 * GREATEST(COALESCE(NUMBER_OF_SETS(m.score), 2) - 2, 0)
                + 0.15 * COALESCE(NUMBER_OF_TIE_BREAKS(m.score), 0)
            ) AS match_load
        FROM matches m
        JOIN events e ON e.id = m.event
        WHERE
            m.status = 'Completed'
            AND e.date IS NOT NULL
            AND e.date >= DATE_SUB(CURDATE(), INTERVAL weeks WEEK)
            AND (m.winner = playerID OR m.loser = playerID)
    ) recent_matches;

    RETURN ROUND(1 / (1 + v_total_load / 4), 4);
END;;

DELIMITER ;
