DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_WIN_FACTOR`;;

CREATE FUNCTION `PLAYER_WIN_FACTOR`(
    playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS DECIMAL(10,4)
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
      Weight: 55%
      Role: core model factor
    - Factor: Ranking
      Weight: 20%
      Role: stable quality adjustment factor
    - Factor: Head To Head
      Weight: 10%
      Role: small adjustment factor
    - Factor: Form
      Weight: 15%
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
    - 55%

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
    - 20%

    Raw factor scale
    - 100 Elo points
    - At 20% weight, the maximum effect is +/-20 Elo points

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
    - 10%

    Raw factor scale
    - 100 Elo points
    - At 10% weight, the maximum effect is +/-10 Elo points

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
    - 15%

    Raw factor scale
    - 100 Elo points
    - At 15% weight, the maximum effect is +/-15 Elo points

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
    - form_factor = (weighted_wins + 4) / (weighted_matches + 8)
    - No matches => 0.5
    - Small samples remain close to neutral

    Inclusion rule
    - If neither player has any qualifying recent matches in the sample,
      the Form factor is excluded entirely.
    - Otherwise the Form factor is included.

    Exact formula
    - elo_raw_gap = elo_player - elo_opponent
    - rank_score = LN(rank_opponent) - LN(rank_player)
    - rank_factor = 1 / (1 + EXP(-rank_score))
    - rank_edge = (rank_factor - 0.5) * 2
    - rank_raw_gap = rank_edge * 100
    - h2h_edge = (h2h_factor - 0.5) * 2
    - h2h_raw_gap = h2h_edge * 100
    - form_edge = form_factor_player - form_factor_opponent
    - form_raw_gap = form_edge * 100
    - weighted_gap_sum =
      (elo_raw_gap * 55)
      + (rank_raw_gap * 20 if included)
      + (h2h_raw_gap * 10 if included)
      + (form_raw_gap * 15 if included)
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
    DECLARE v_elo_factor_weight DOUBLE DEFAULT 55;
    DECLARE v_rank_factor_weight DOUBLE DEFAULT 20;
    DECLARE v_rank_factor_raw_elo DOUBLE DEFAULT 100;
    DECLARE v_h2h_factor_weight DOUBLE DEFAULT 10;
    DECLARE v_h2h_factor_raw_elo DOUBLE DEFAULT 100;
    DECLARE v_form_factor_weight DOUBLE DEFAULT 15;
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
    DECLARE v_form_factor_player DOUBLE DEFAULT 0.5;
    DECLARE v_form_factor_opponent DOUBLE DEFAULT 0.5;
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
        COALESCE(SUM(CASE WHEN is_win = 1 THEN match_weight ELSE 0 END), 0) AS weighted_wins
    INTO
        v_form_matches_player,
        v_form_wins_player
    FROM (
        SELECT
            CASE WHEN m.winner = playerID THEN 1 ELSE 0 END AS is_win,
            POW(0.5, GREATEST(DATEDIFF(CURDATE(), e.date), 0) / v_form_window_days) AS match_weight
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
        COALESCE(SUM(CASE WHEN is_win = 1 THEN match_weight ELSE 0 END), 0) AS weighted_wins
    INTO
        v_form_matches_opponent,
        v_form_wins_opponent
    FROM (
        SELECT
            CASE WHEN m.winner = opponentID THEN 1 ELSE 0 END AS is_win,
            POW(0.5, GREATEST(DATEDIFF(CURDATE(), e.date), 0) / v_form_window_days) AS match_weight
        FROM matches m
        JOIN events e ON e.id = m.event
        WHERE
            m.status = 'Completed'
            AND e.date IS NOT NULL
            AND e.date >= DATE_SUB(CURDATE(), INTERVAL v_form_weeks WEEK)
            AND (m.winner = opponentID OR m.loser = opponentID)
    ) recent_opponent_matches;

    IF v_form_matches_player > 0 OR v_form_matches_opponent > 0 THEN
        SET v_include_form = 1;
        SET v_form_factor_player = (v_form_wins_player + 4) / (v_form_matches_player + 8);
        SET v_form_factor_opponent = (v_form_wins_opponent + 4) / (v_form_matches_opponent + 8);
        SET v_form_edge = v_form_factor_player - v_form_factor_opponent;
        SET v_form_raw_gap = v_form_edge * v_form_factor_raw_elo;
    ELSE
        SET v_include_form = 0;
        SET v_form_factor_player = NULL;
        SET v_form_factor_opponent = NULL;
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
END;;

DELIMITER ;
