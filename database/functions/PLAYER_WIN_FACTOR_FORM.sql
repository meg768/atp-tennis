DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_WIN_FACTOR_FORM`;;

CREATE FUNCTION `PLAYER_WIN_FACTOR_FORM`(
    playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS DECIMAL(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_WIN_FACTOR_FORM(playerID, opponentID, surface)

    Purpose
    - Return a form-based win probability for playerID against opponentID.
    - Higher return value means playerID is more likely to win.
    - 0.5 is neutral.

    Model
    - This function is intentionally form-only.
    - No Elo adjustment is applied.
    - No ranking model is applied outside the quality-of-results term below.
    - No head-to-head adjustment is applied.

    Current sample design
    - Look only at completed matches for each player separately.
    - Ignore matches without a known event date.
    - Restrict the sample to the last 8 weeks.
    - Weight newer matches higher than older matches.
    - The surface argument is accepted for API consistency but is currently
      ignored so this function measures overall recent form.

    Form components
    - Base results:
      smoothed recent win rate
    - Quality of results:
      rewards wins against better-ranked opponents and penalizes losses
      against worse-ranked opponents
    - Set dominance:
      rewards more decisive wins and penalizes more decisive losses

    Recency weighting
    - match_weight = POW(0.5, days_ago / window_days)
    - window_days = 8 * 7

    Smoothing
    - base_form_factor = (weighted_wins + 4) / (weighted_matches + 8)
    - No recent matches => 0.5

    Quality formula
    - quality_factor = 0.5 + 0.5 * (weighted_quality_score / (weighted_matches + 2))
    - quality_factor is clamped to 0.0..1.0

    Dominance formula
    - dominance_factor = 0.5 + 0.5 * (weighted_dominance_score / (weighted_matches + 2))
    - dominance_factor is clamped to 0.0..1.0

    Final form blend
    - final_form_factor =
      (base_form_factor * 60%)
      + (quality_factor * 25%)
      + (dominance_factor * 15%)

    Probability conversion
    - form_edge = final_form_factor_player - final_form_factor_opponent
    - form_raw_gap = form_edge * 100
    - probability = 1 / (1 + POW(10, -form_raw_gap / 400))

    Inputs and edge cases
    - playerID and opponentID may be ATP ids or player names
    - Invalid player reference => NULL
    - Invalid opponent reference => NULL
    - Same player and opponent => NULL
    - No qualifying recent matches on either side => 0.5
    */

    DECLARE v_player_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_opponent_id VARCHAR(32) DEFAULT NULL;
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
    DECLARE v_probability DOUBLE DEFAULT 0.5;

    IF playerID IS NULL OR TRIM(playerID) = '' OR opponentID IS NULL OR TRIM(opponentID) = '' THEN
        RETURN NULL;
    END IF;

    SET v_player_id = PLAYER_LOOKUP(playerID);
    SET v_opponent_id = PLAYER_LOOKUP(opponentID);

    IF v_player_id IS NULL OR v_opponent_id IS NULL THEN
        RETURN NULL;
    END IF;

    IF UPPER(v_player_id) = UPPER(v_opponent_id) THEN
        RETURN NULL;
    END IF;

    SET v_form_window_days = v_form_weeks * 7;

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
            CASE WHEN m.winner = v_player_id THEN 1 ELSE 0 END AS is_win,
            POW(0.5, GREATEST(DATEDIFF(CURDATE(), e.date), 0) / v_form_window_days) AS match_weight,
            CASE
                WHEN m.winner = v_player_id
                    AND m.winner_rank IS NOT NULL
                    AND m.loser_rank IS NOT NULL
                    AND m.winner_rank > 0
                    AND m.loser_rank > 0
                    AND m.winner_rank > m.loser_rank
                THEN LEAST(1, (LN(m.winner_rank) - LN(m.loser_rank)) / LN(4))
                WHEN m.loser = v_player_id
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
                        WHEN m.winner = v_player_id THEN
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
                        WHEN m.loser = v_player_id THEN
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
            AND (m.winner = v_player_id OR m.loser = v_player_id)
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
            CASE WHEN m.winner = v_opponent_id THEN 1 ELSE 0 END AS is_win,
            POW(0.5, GREATEST(DATEDIFF(CURDATE(), e.date), 0) / v_form_window_days) AS match_weight,
            CASE
                WHEN m.winner = v_opponent_id
                    AND m.winner_rank IS NOT NULL
                    AND m.loser_rank IS NOT NULL
                    AND m.winner_rank > 0
                    AND m.loser_rank > 0
                    AND m.winner_rank > m.loser_rank
                THEN LEAST(1, (LN(m.winner_rank) - LN(m.loser_rank)) / LN(4))
                WHEN m.loser = v_opponent_id
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
                        WHEN m.winner = v_opponent_id THEN
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
                        WHEN m.loser = v_opponent_id THEN
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
            AND (m.winner = v_opponent_id OR m.loser = v_opponent_id)
    ) recent_opponent_matches;

    IF v_form_matches_player = 0 AND v_form_matches_opponent = 0 THEN
        RETURN 0.5;
    END IF;

    SET v_form_base_factor_player = (v_form_wins_player + 4) / (v_form_matches_player + 8);
    SET v_form_base_factor_opponent = (v_form_wins_opponent + 4) / (v_form_matches_opponent + 8);

    SET v_form_quality_factor_player = 0.5 + 0.5 * (v_form_quality_score_player / (v_form_matches_player + 2));
    SET v_form_quality_factor_opponent = 0.5 + 0.5 * (v_form_quality_score_opponent / (v_form_matches_opponent + 2));
    SET v_form_quality_factor_player = GREATEST(0, LEAST(1, v_form_quality_factor_player));
    SET v_form_quality_factor_opponent = GREATEST(0, LEAST(1, v_form_quality_factor_opponent));

    SET v_form_dominance_factor_player = 0.5 + 0.5 * (v_form_dominance_score_player / (v_form_matches_player + 2));
    SET v_form_dominance_factor_opponent = 0.5 + 0.5 * (v_form_dominance_score_opponent / (v_form_matches_opponent + 2));
    SET v_form_dominance_factor_player = GREATEST(0, LEAST(1, v_form_dominance_factor_player));
    SET v_form_dominance_factor_opponent = GREATEST(0, LEAST(1, v_form_dominance_factor_opponent));

    SET v_form_factor_player = (v_form_base_factor_player * v_form_base_weight)
        + (v_form_quality_factor_player * v_form_quality_weight)
        + (v_form_dominance_factor_player * v_form_dominance_weight);

    SET v_form_factor_opponent = (v_form_base_factor_opponent * v_form_base_weight)
        + (v_form_quality_factor_opponent * v_form_quality_weight)
        + (v_form_dominance_factor_opponent * v_form_dominance_weight);

    SET v_form_edge = v_form_factor_player - v_form_factor_opponent;
    SET v_form_raw_gap = v_form_edge * 100;
    SET v_probability = 1 / (1 + POW(10, -v_form_raw_gap / 400));

    RETURN ROUND(v_probability, 4);
END;;

DELIMITER ;
