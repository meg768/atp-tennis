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
    - Return the currently active win probability model.
    - Keep this function as the main model entry point while individual factor
      functions can be tested and tuned separately.

    Current model
    - Blend Elo, Form, Rating, Ranking, and Head-to-Head probabilities.
    - Elo remains the base signal.
    - Form, Rating, Ranking, and Head-to-Head act as smaller complementary
      signals.

    Weights
    - Elo     = 45
    - Form    = 20
    - Rating  = 15
    - Ranking = 10
    - HTH     = 10
    - These are relative weights and do not need to sum to 1.0.
    - The function normalizes them internally.

    Blend formula
    - total_weight =
      elo_weight + form_weight + rating_weight + ranking_weight + hth_weight
    - final_probability =
      (
        (elo_probability * elo_weight)
        + (form_probability * form_weight)
        + (rating_probability * rating_weight)
        + (ranking_probability * ranking_weight)
        + (hth_probability * hth_weight)
      ) / total_weight

    Inputs and edge cases
    - playerID and opponentID may be ATP ids or player names.
    - If either factor returns NULL, the combined result becomes NULL.
    - Input validation is delegated to the factor functions.
    */

    DECLARE v_elo_weight DOUBLE DEFAULT 45;
    DECLARE v_form_weight DOUBLE DEFAULT 20;
    DECLARE v_rating_weight DOUBLE DEFAULT 15;
    DECLARE v_ranking_weight DOUBLE DEFAULT 10;
    DECLARE v_hth_weight DOUBLE DEFAULT 10;
    DECLARE v_total_weight DOUBLE DEFAULT 0;
    DECLARE v_probability DOUBLE DEFAULT NULL;

    SET v_total_weight =
        v_elo_weight
        + v_form_weight
        + v_rating_weight
        + v_ranking_weight
        + v_hth_weight;

    IF v_total_weight <= 0 THEN
        RETURN NULL;
    END IF;

    SET v_probability = (
        (PLAYER_WIN_FACTOR_ELO(playerID, opponentID, surface) * v_elo_weight)
        + (PLAYER_WIN_FACTOR_FORM(playerID, opponentID, surface) * v_form_weight)
        + (PLAYER_WIN_FACTOR_RATING(playerID, opponentID, surface) * v_rating_weight)
        + (PLAYER_WIN_FACTOR_RANKING(playerID, opponentID, surface) * v_ranking_weight)
        + (PLAYER_WIN_FACTOR_HTH(playerID, opponentID, surface) * v_hth_weight)
    ) / v_total_weight;

    RETURN ROUND(v_probability, 4);
END;;

DELIMITER ;
