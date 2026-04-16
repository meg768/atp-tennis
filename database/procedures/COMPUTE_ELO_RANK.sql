DELIMITER ;;

DROP PROCEDURE IF EXISTS `COMPUTE_ELO_RANK_TOTAL`;;
DROP PROCEDURE IF EXISTS `COMPUTE_ELO_RANK`;;

CREATE PROCEDURE `COMPUTE_ELO_RANK`()
BEGIN
    /*
    COMPUTE_ELO_RANK()

    Purpose
    - Rebuild players.elo_rank from the matches and events tables.
    - This procedure is intended as a database-native replacement for the
      overall Elo portion of update-elo.js.

    Design goals
    - Keep the Elo calculation close to the data so the model can be iterated
      directly in MariaDB without changing Node code or restarting services.
    - Make the full Elo rebuild readable from the SQL definition alone.
    - Keep the procedure deterministic for a fixed database state by ordering
      matches chronologically and then by round order inside each event.

    Current scope
    - This procedure computes only the overall Elo rating.
    - Surface-specific Elo can later be handled by a separate procedure such as
      COMPUTE_SURFACE_ELO_RANK(surface).

    Included matches
    - Use matches joined to events where:
      - events.date IS NOT NULL
      - matches.winner IS NOT NULL
      - matches.loser IS NOT NULL
      - matches.status = 'Completed'

    Elo rules
    - Initial Elo for a new player: 1500
    - Expected score:
      expected = 1 / (1 + 10 ^ ((opponent_elo - player_elo) / 400))
    - Actual score:
      winner = 1
      loser = 0
    - Player-specific K-factor:
      k = 250 / POW(matches_played + 5, 0.4)
    - Grand Slam multiplier:
      - event_type = 'Grand Slam' => multiply K by 1.1
      - all other events => multiply K by 1.0

    Match ordering
    - Order by:
      1. event date ascending
      2. event id ascending
      3. round order ascending
      4. match id ascending
    - The round order matches the logic currently used in update-elo.js.

    Output
    - First set every player's elo_rank to NULL.
    - Then write the rebuilt overall Elo into players.elo_rank for every player
      that appears in at least one qualifying match.

    Maintenance note
    - This procedure is intentionally written as a first stored-procedure
      version of the current Elo model.
    - If the Node implementation changes, keep this SQL version in sync.
    - If this procedure becomes the primary Elo engine later, update the schema
      dump and retire the duplicated Node implementation.
    */

    DECLARE done INT DEFAULT 0;
    DECLARE v_match_id VARCHAR(50) DEFAULT NULL;
    DECLARE v_winner_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_loser_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_event_type VARCHAR(50) DEFAULT NULL;
    DECLARE v_matches_winner INT DEFAULT 0;
    DECLARE v_matches_loser INT DEFAULT 0;
    DECLARE v_elo_winner DOUBLE DEFAULT 1500;
    DECLARE v_elo_loser DOUBLE DEFAULT 1500;
    DECLARE v_expected_winner DOUBLE DEFAULT 0.5;
    DECLARE v_expected_loser DOUBLE DEFAULT 0.5;
    DECLARE v_k_winner DOUBLE DEFAULT 0;
    DECLARE v_k_loser DOUBLE DEFAULT 0;
    DECLARE v_event_multiplier DOUBLE DEFAULT 1;

    DECLARE match_cursor CURSOR FOR
        SELECT
            m.id,
            m.winner AS winner_id,
            m.loser AS loser_id,
            e.type AS event_type
        FROM matches m
        JOIN events e ON e.id = m.event
        WHERE
            e.date IS NOT NULL
            AND m.winner IS NOT NULL
            AND m.loser IS NOT NULL
            AND m.status = 'Completed'
        ORDER BY
            e.date ASC,
            m.event ASC,
            CASE m.round
                WHEN 'RR' THEN 10
                WHEN 'R128' THEN 20
                WHEN 'R64' THEN 30
                WHEN 'R56' THEN 35
                WHEN 'R48' THEN 40
                WHEN 'R32' THEN 50
                WHEN 'R24' THEN 55
                WHEN 'R16' THEN 60
                WHEN 'QF' THEN 70
                WHEN 'SF' THEN 80
                WHEN 'BR' THEN 85
                WHEN 'F' THEN 90
                ELSE 999
            END ASC,
            m.id ASC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    DROP TEMPORARY TABLE IF EXISTS tmp_elo_rank;
    CREATE TEMPORARY TABLE tmp_elo_rank (
        id VARCHAR(32) NOT NULL PRIMARY KEY,
        elo_rank DOUBLE NOT NULL DEFAULT 1500,
        matches_played INT NOT NULL DEFAULT 0
    ) ENGINE=MEMORY;

    OPEN match_cursor;

    read_loop: LOOP
        FETCH match_cursor INTO v_match_id, v_winner_id, v_loser_id, v_event_type;

        IF done = 1 THEN
            LEAVE read_loop;
        END IF;

        INSERT IGNORE INTO tmp_elo_rank (id) VALUES (v_winner_id), (v_loser_id);

        SELECT elo_rank, matches_played
        INTO v_elo_winner, v_matches_winner
        FROM tmp_elo_rank
        WHERE id = v_winner_id
        LIMIT 1;

        SELECT elo_rank, matches_played
        INTO v_elo_loser, v_matches_loser
        FROM tmp_elo_rank
        WHERE id = v_loser_id
        LIMIT 1;

        SET v_expected_winner = 1 / (1 + POW(10, (v_elo_loser - v_elo_winner) / 400));
        SET v_expected_loser = 1 / (1 + POW(10, (v_elo_winner - v_elo_loser) / 400));

        SET v_k_winner = 250 / POW(v_matches_winner + 5, 0.4);
        SET v_k_loser = 250 / POW(v_matches_loser + 5, 0.4);
        SET v_event_multiplier = CASE WHEN v_event_type = 'Grand Slam' THEN 1.1 ELSE 1 END;

        UPDATE tmp_elo_rank
        SET
            elo_rank = v_elo_winner + v_event_multiplier * v_k_winner * (1 - v_expected_winner),
            matches_played = v_matches_winner + 1
        WHERE id = v_winner_id;

        UPDATE tmp_elo_rank
        SET
            elo_rank = v_elo_loser + v_event_multiplier * v_k_loser * (0 - v_expected_loser),
            matches_played = v_matches_loser + 1
        WHERE id = v_loser_id;
    END LOOP;

    CLOSE match_cursor;

    UPDATE players
    SET elo_rank = NULL;

    UPDATE players p
    JOIN tmp_elo_rank t ON t.id = p.id
    SET p.elo_rank = t.elo_rank;

    DROP TEMPORARY TABLE IF EXISTS tmp_elo_rank;
END;;

DELIMITER ;
