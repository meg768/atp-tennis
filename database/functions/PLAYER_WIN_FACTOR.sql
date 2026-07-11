DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_WIN_FACTOR`;;

CREATE FUNCTION `PLAYER_WIN_FACTOR`(
    playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS DOUBLE
    DETERMINISTIC
BEGIN
    /*
    Canonical TA-calibrated CODEX probability model.

    For a real match it uses total TA ELO, surface TA ELO, ATP ranking,
    career surface record, latest-12 main-tour form, and 365-day form.
    With no surface it uses pure total TA ELO, matching hypothetical H2H in
    Match Point. Coefficients are from the chronological Codex backtest.
    */
    DECLARE v_player_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_opponent_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_surface VARCHAR(50) DEFAULT NULL;
    DECLARE v_surface_name VARCHAR(50) DEFAULT NULL;

    DECLARE v_overall_a DOUBLE DEFAULT 1500;
    DECLARE v_overall_b DOUBLE DEFAULT 1500;
    DECLARE v_surface_a DOUBLE DEFAULT 1500;
    DECLARE v_surface_b DOUBLE DEFAULT 1500;
    DECLARE v_rank_a INT DEFAULT NULL;
    DECLARE v_rank_b INT DEFAULT NULL;

    DECLARE v_surface_matches_a INT DEFAULT 0;
    DECLARE v_surface_wins_a INT DEFAULT 0;
    DECLARE v_surface_matches_b INT DEFAULT 0;
    DECLARE v_surface_wins_b INT DEFAULT 0;
    DECLARE v_form_matches_a INT DEFAULT 0;
    DECLARE v_form_wins_a INT DEFAULT 0;
    DECLARE v_form_matches_b INT DEFAULT 0;
    DECLARE v_form_wins_b INT DEFAULT 0;
    DECLARE v_recent_matches_a INT DEFAULT 0;
    DECLARE v_recent_wins_a INT DEFAULT 0;
    DECLARE v_recent_matches_b INT DEFAULT 0;
    DECLARE v_recent_wins_b INT DEFAULT 0;

    DECLARE v_feature_overall DOUBLE DEFAULT 0;
    DECLARE v_feature_surface DOUBLE DEFAULT 0;
    DECLARE v_feature_ranking DOUBLE DEFAULT 0;
    DECLARE v_feature_surface_form DOUBLE DEFAULT 0;
    DECLARE v_feature_form12 DOUBLE DEFAULT 0;
    DECLARE v_feature_form365 DOUBLE DEFAULT 0;
    DECLARE v_score DOUBLE DEFAULT 0.0000253868667645;
    DECLARE v_probability DOUBLE DEFAULT NULL;

    IF playerID IS NULL OR TRIM(playerID) = '' OR opponentID IS NULL OR TRIM(opponentID) = '' THEN
        RETURN NULL;
    END IF;

    SET v_player_id = PLAYER_LOOKUP(playerID);
    SET v_opponent_id = PLAYER_LOOKUP(opponentID);
    IF v_player_id IS NULL OR v_opponent_id IS NULL OR UPPER(v_player_id) = UPPER(v_opponent_id) THEN
        RETURN NULL;
    END IF;

    SET v_surface = UPPER(NULLIF(TRIM(surface), ''));
    SET v_surface_name = CASE v_surface
        WHEN 'HARD' THEN 'Hard'
        WHEN 'CLAY' THEN 'Clay'
        WHEN 'GRASS' THEN 'Grass'
        ELSE NULL
    END;

    SELECT
        COALESCE(elo_rank, 1500),
        COALESCE(CASE v_surface
            WHEN 'HARD' THEN elo_rank_hard
            WHEN 'CLAY' THEN elo_rank_clay
            WHEN 'GRASS' THEN elo_rank_grass
            ELSE elo_rank
        END, elo_rank, 1500),
        rank
    INTO v_overall_a, v_surface_a, v_rank_a
    FROM players WHERE id = v_player_id LIMIT 1;

    SELECT
        COALESCE(elo_rank, 1500),
        COALESCE(CASE v_surface
            WHEN 'HARD' THEN elo_rank_hard
            WHEN 'CLAY' THEN elo_rank_clay
            WHEN 'GRASS' THEN elo_rank_grass
            ELSE elo_rank
        END, elo_rank, 1500),
        rank
    INTO v_overall_b, v_surface_b, v_rank_b
    FROM players WHERE id = v_opponent_id LIMIT 1;

    IF v_surface_name IS NULL THEN
        SET v_probability = 1 / (1 + POW(10, (v_overall_b - v_overall_a) / 400));
        RETURN LEAST(0.995, GREATEST(0.005, v_probability));
    END IF;

    SELECT COUNT(*), COALESCE(SUM(m.winner = v_player_id), 0)
    INTO v_surface_matches_a, v_surface_wins_a
    FROM matches m JOIN events e ON e.id = m.event
    WHERE m.winner IS NOT NULL AND m.loser IS NOT NULL
      AND e.surface = v_surface_name
      AND (m.winner = v_player_id OR m.loser = v_player_id);

    SELECT COUNT(*), COALESCE(SUM(m.winner = v_opponent_id), 0)
    INTO v_surface_matches_b, v_surface_wins_b
    FROM matches m JOIN events e ON e.id = m.event
    WHERE m.winner IS NOT NULL AND m.loser IS NOT NULL
      AND e.surface = v_surface_name
      AND (m.winner = v_opponent_id OR m.loser = v_opponent_id);

    SELECT COUNT(*), COALESCE(SUM(recent.winner = v_player_id), 0)
    INTO v_form_matches_a, v_form_wins_a
    FROM (
        SELECT m.winner
        FROM matches m JOIN events e ON e.id = m.event
        WHERE e.date IS NOT NULL
          AND e.type IN ('Grand Slam', 'Masters', 'ATP-500', 'ATP-250')
          AND m.winner IS NOT NULL AND m.loser IS NOT NULL
          AND (m.winner = v_player_id OR m.loser = v_player_id)
        ORDER BY e.date DESC, e.id DESC, m.id DESC
        LIMIT 12
    ) recent;

    SELECT COUNT(*), COALESCE(SUM(recent.winner = v_opponent_id), 0)
    INTO v_form_matches_b, v_form_wins_b
    FROM (
        SELECT m.winner
        FROM matches m JOIN events e ON e.id = m.event
        WHERE e.date IS NOT NULL
          AND e.type IN ('Grand Slam', 'Masters', 'ATP-500', 'ATP-250')
          AND m.winner IS NOT NULL AND m.loser IS NOT NULL
          AND (m.winner = v_opponent_id OR m.loser = v_opponent_id)
        ORDER BY e.date DESC, e.id DESC, m.id DESC
        LIMIT 12
    ) recent;

    SELECT COUNT(*), COALESCE(SUM(m.winner = v_player_id), 0)
    INTO v_recent_matches_a, v_recent_wins_a
    FROM matches m JOIN events e ON e.id = m.event
    WHERE e.date IS NOT NULL AND e.date >= CURDATE() - INTERVAL 365 DAY
      AND m.winner IS NOT NULL AND m.loser IS NOT NULL
      AND (m.winner = v_player_id OR m.loser = v_player_id);

    SELECT COUNT(*), COALESCE(SUM(m.winner = v_opponent_id), 0)
    INTO v_recent_matches_b, v_recent_wins_b
    FROM matches m JOIN events e ON e.id = m.event
    WHERE e.date IS NOT NULL AND e.date >= CURDATE() - INTERVAL 365 DAY
      AND m.winner IS NOT NULL AND m.loser IS NOT NULL
      AND (m.winner = v_opponent_id OR m.loser = v_opponent_id);

    SET v_feature_overall = (v_overall_a - v_overall_b) / 400;
    SET v_feature_surface = (v_surface_a - v_surface_b) / 400;
    IF v_rank_a IS NOT NULL AND v_rank_a > 0 AND v_rank_b IS NOT NULL AND v_rank_b > 0 THEN
        SET v_feature_ranking = LN(v_rank_b / v_rank_a);
    END IF;
    SET v_feature_surface_form =
        (CASE WHEN v_surface_matches_a > 0 THEN v_surface_wins_a / v_surface_matches_a ELSE 0.5 END)
        - (CASE WHEN v_surface_matches_b > 0 THEN v_surface_wins_b / v_surface_matches_b ELSE 0.5 END);
    SET v_feature_form12 =
        (CASE WHEN v_form_matches_a > 0 THEN v_form_wins_a / v_form_matches_a ELSE 0.5 END)
        - (CASE WHEN v_form_matches_b > 0 THEN v_form_wins_b / v_form_matches_b ELSE 0.5 END);
    SET v_feature_form365 =
        (CASE WHEN v_recent_matches_a > 0 THEN v_recent_wins_a / v_recent_matches_a ELSE 0.5 END)
        - (CASE WHEN v_recent_matches_b > 0 THEN v_recent_wins_b / v_recent_matches_b ELSE 0.5 END);

    SET v_score = v_score
        + 0.308259581872 * (v_feature_overall / 0.480841409542)
        + 0.271303033199 * (v_feature_surface / 0.453431590526)
        + 0.226042701631 * (v_feature_ranking / 1.032929982385)
        + 0.067860094189 * (v_feature_surface_form / 0.218879304230)
        + 0.066165906183 * (v_feature_form12 / 0.253832178694)
        + 0.031416125989 * (v_feature_form365 / 0.211008586769);

    SET v_probability = 1 / (1 + EXP(-v_score));
    RETURN LEAST(0.995, GREATEST(0.005, v_probability));
END;;

DELIMITER ;
