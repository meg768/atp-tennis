DROP PROCEDURE IF EXISTS sp_update_surface_factors;

DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `sp_update_surface_factors`()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE current_player_id VARCHAR(50);
  DECLARE player_cursor CURSOR FOR SELECT id FROM players;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  -- Open cursor and loop through each player
  OPEN player_cursor;

  player_loop: LOOP
    FETCH player_cursor INTO current_player_id;
    IF done THEN
      LEAVE player_loop;
    END IF;

    -- Call the per-player update procedure
    CALL sp_update_player_surface_factors(current_player_id);
  END LOOP;

  CLOSE player_cursor;
END;;
DELIMITER ;
