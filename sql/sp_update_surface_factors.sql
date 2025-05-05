DROP PROCEDURE IF EXISTS sp_update_surface_factors;
DELIMITER $$

CREATE PROCEDURE sp_update_surface_factors()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id VARCHAR(50);

  DECLARE cur CURSOR FOR SELECT id FROM players WHERE rank <= 100;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  -- Step 1: Drop and recreate temporary table
  DROP TEMPORARY TABLE IF EXISTS recent_matches;

  CREATE TEMPORARY TABLE recent_matches AS
    SELECT * FROM flatly
    WHERE event_date >= CURDATE() - INTERVAL 2 YEAR;

  -- Step 2: Reset existing surface factors
  UPDATE players
  SET clay_factor = NULL, hard_factor = NULL, grass_factor = NULL;

  -- Step 3: Open cursor and loop through players
  OPEN cur;

  read_loop: LOOP
    FETCH cur INTO v_id;
    IF done THEN
      LEAVE read_loop;
    END IF;

    -- Step 4: Update surface factors using recent_matches
    UPDATE players
    SET
      clay_factor = (
        SELECT 
          ROUND(100 * COUNT(*) / NULLIF((
            SELECT COUNT(*) FROM recent_matches 
            WHERE event_surface = 'Clay' AND (winner_id = v_id OR loser_id = v_id)
          ), 0))
        FROM recent_matches 
        WHERE event_surface = 'Clay' AND winner_id = v_id
      ),
      hard_factor = (
        SELECT 
          ROUND(100 * COUNT(*) / NULLIF((
            SELECT COUNT(*) FROM recent_matches 
            WHERE event_surface = 'Hard' AND (winner_id = v_id OR loser_id = v_id)
          ), 0))
        FROM recent_matches 
        WHERE event_surface = 'Hard' AND winner_id = v_id
      ),
      grass_factor = (
        SELECT 
          ROUND(100 * COUNT(*) / NULLIF((
            SELECT COUNT(*) FROM recent_matches 
            WHERE event_surface = 'Grass' AND (winner_id = v_id OR loser_id = v_id)
          ), 0))
        FROM recent_matches 
        WHERE event_surface = 'Grass' AND winner_id = v_id
      )
    WHERE id = v_id;

  END LOOP;

  CLOSE cur;
END$$

DELIMITER ;

CALL sp_update_surface_factors();
