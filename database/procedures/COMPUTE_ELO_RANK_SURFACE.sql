DELIMITER ;;

DROP PROCEDURE IF EXISTS `COMPUTE_ELO_RANK_SURFACE`;;

CREATE PROCEDURE `COMPUTE_ELO_RANK_SURFACE`(
    IN inputSurface VARCHAR(50)
)
BEGIN
    /*
    COMPUTE_ELO_RANK_SURFACE(inputSurface)

    Purpose
    - Rebuild one surface-specific Elo column in players:
      - Hard  => elo_rank_hard
      - Clay  => elo_rank_clay
      - Grass => elo_rank_grass
    - This procedure is intended as a database-native replacement for the
      surface Elo portion of update-elo.js.

    Design goals
    - Keep surface Elo experimentation in MariaDB so the model can be tuned
      without backend deploys or service restarts.
    - Keep the full surface Elo logic readable from the SQL definition alone.
    - Keep total Elo and surface Elo conceptually separate:
      - COMPUTE_ELO_RANK() builds players.elo_rank
      - COMPUTE_ELO_RANK_SURFACE(surface) builds one surface column from
        surface-only matches plus a shrink/blend step

    Supported inputs
    - Hard
    - Clay
    - Grass
    - Input is case-insensitive

    Included matches
    - Use only matches joined to events where:
      - events.date IS NOT NULL
      - matches.winner IS NOT NULL
      - matches.loser IS NOT NULL
      - matches.status = 'Completed'
      - events.surface = selected surface

    Surface Elo rules
    - Initial surface Elo for a new player: 1500
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

    Surface normalization
    - Raw surface Elo can be misleading for players with very small samples.
    - To avoid treating "tiny sample" as reliable surface skill, the raw
      surface Elo is shrunk toward the neutral baseline of 1500.
    - surface_sample_k = 20
    - surface_weight = surface_matches / (surface_matches + surface_sample_k)
    - normalized_surface_elo = 1500 + surface_weight * (raw_surface_elo - 1500)

    Final surface blend
    - After normalization, blend the surface Elo with total Elo:
      final_surface_elo = (elo_rank + normalized_surface_elo) / 2
    - This mirrors the current design intent of using total Elo as an anchor
      while still allowing the selected surface to matter.

    Important behavior
    - If a player has zero matches on the selected surface:
      - raw surface Elo remains 1500
      - normalized surface Elo remains 1500
      - final stored surface Elo becomes (elo_rank + 1500) / 2
    - This avoids the previous behavior where surface Elo could fall back
      directly to total Elo and overstate surface skill.

    Prerequisite
    - players.elo_rank should already be populated before running this
      procedure.

    Output
    - Reset the selected surface Elo column to NULL for all players.
    - Then write the rebuilt surface Elo into the selected column for every
      player that has a non-NULL total elo_rank.

    Maintenance note
    - This is a first stored-procedure version of the current surface Elo idea.
    - The shrink constant, baseline, and final blend can all be tuned later in
      one place here.
    */

    DECLARE done INT DEFAULT 0;
    DECLARE v_surface VARCHAR(50) DEFAULT NULL;
    DECLARE v_target_column VARCHAR(64) DEFAULT NULL;
    DECLARE v_sql_update_null TEXT DEFAULT NULL;
    DECLARE v_sql_update_values TEXT DEFAULT NULL;
    DECLARE v_match_id VARCHAR(50) DEFAULT NULL;
    DECLARE v_winner_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_loser_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_event_type VARCHAR(50) DEFAULT NULL;
    DECLARE v_matches_winner INT DEFAULT 0;
    DECLARE v_matches_loser INT DEFAULT 0;
    DECLARE v_raw_surface_elo_winner DOUBLE DEFAULT 1500;
    DECLARE v_raw_surface_elo_loser DOUBLE DEFAULT 1500;
    DECLARE v_expected_winner DOUBLE DEFAULT 0.5;
    DECLARE v_expected_loser DOUBLE DEFAULT 0.5;
    DECLARE v_k_winner DOUBLE DEFAULT 0;
    DECLARE v_k_loser DOUBLE DEFAULT 0;
    DECLARE v_event_multiplier DOUBLE DEFAULT 1;
    DECLARE v_surface_sample_k DOUBLE DEFAULT 20;

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
            AND e.surface = v_surface
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

    SET v_surface = CONCAT(
        UCASE(LEFT(TRIM(inputSurface), 1)),
        LCASE(SUBSTRING(TRIM(inputSurface), 2))
    );

    IF v_surface NOT IN ('Hard', 'Clay', 'Grass') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'COMPUTE_ELO_RANK_SURFACE requires Hard, Clay, or Grass.';
    END IF;

    SET v_target_column = CASE v_surface
        WHEN 'Hard' THEN 'elo_rank_hard'
        WHEN 'Clay' THEN 'elo_rank_clay'
        WHEN 'Grass' THEN 'elo_rank_grass'
        ELSE NULL
    END;

    DROP TEMPORARY TABLE IF EXISTS tmp_surface_elo_rank;
    CREATE TEMPORARY TABLE tmp_surface_elo_rank (
        id VARCHAR(32) NOT NULL PRIMARY KEY,
        raw_surface_elo DOUBLE NOT NULL DEFAULT 1500,
        surface_matches INT NOT NULL DEFAULT 0
    ) ENGINE=MEMORY;

    OPEN match_cursor;

    read_loop: LOOP
        FETCH match_cursor INTO v_match_id, v_winner_id, v_loser_id, v_event_type;

        IF done = 1 THEN
            LEAVE read_loop;
        END IF;

        INSERT IGNORE INTO tmp_surface_elo_rank (id) VALUES (v_winner_id), (v_loser_id);

        SELECT raw_surface_elo, surface_matches
        INTO v_raw_surface_elo_winner, v_matches_winner
        FROM tmp_surface_elo_rank
        WHERE id = v_winner_id
        LIMIT 1;

        SELECT raw_surface_elo, surface_matches
        INTO v_raw_surface_elo_loser, v_matches_loser
        FROM tmp_surface_elo_rank
        WHERE id = v_loser_id
        LIMIT 1;

        SET v_expected_winner = 1 / (1 + POW(10, (v_raw_surface_elo_loser - v_raw_surface_elo_winner) / 400));
        SET v_expected_loser = 1 / (1 + POW(10, (v_raw_surface_elo_winner - v_raw_surface_elo_loser) / 400));

        SET v_k_winner = 250 / POW(v_matches_winner + 5, 0.4);
        SET v_k_loser = 250 / POW(v_matches_loser + 5, 0.4);
        SET v_event_multiplier = CASE WHEN v_event_type = 'Grand Slam' THEN 1.1 ELSE 1 END;

        UPDATE tmp_surface_elo_rank
        SET
            raw_surface_elo = v_raw_surface_elo_winner + v_event_multiplier * v_k_winner * (1 - v_expected_winner),
            surface_matches = v_matches_winner + 1
        WHERE id = v_winner_id;

        UPDATE tmp_surface_elo_rank
        SET
            raw_surface_elo = v_raw_surface_elo_loser + v_event_multiplier * v_k_loser * (0 - v_expected_loser),
            surface_matches = v_matches_loser + 1
        WHERE id = v_loser_id;
    END LOOP;

    CLOSE match_cursor;

    SET @sql_update_null = CONCAT('UPDATE players SET ', v_target_column, ' = NULL');
    PREPARE stmt_update_null FROM @sql_update_null;
    EXECUTE stmt_update_null;
    DEALLOCATE PREPARE stmt_update_null;

    SET @sql_update_values = CONCAT(
        'UPDATE players p ',
        'LEFT JOIN tmp_surface_elo_rank t ON t.id = p.id ',
        'SET p.', v_target_column, ' = CASE ',
        'WHEN p.elo_rank IS NULL THEN NULL ',
        'WHEN t.id IS NULL THEN (p.elo_rank + 1500) / 2 ',
        'ELSE (p.elo_rank + (1500 + (t.surface_matches / (t.surface_matches + ', v_surface_sample_k, ')) * (t.raw_surface_elo - 1500))) / 2 ',
        'END'
    );

    PREPARE stmt_update_values FROM @sql_update_values;
    EXECUTE stmt_update_values;
    DEALLOCATE PREPARE stmt_update_values;

    DROP TEMPORARY TABLE IF EXISTS tmp_surface_elo_rank;
END;;

DELIMITER ;
