DROP PROCEDURE IF EXISTS sp_update_surface_factors;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `sp_update_surface_factors`()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE current_player_id VARCHAR(50);

  -- Cursor: endast aktiva spelare
  DECLARE player_cursor CURSOR FOR
      SELECT id FROM players WHERE active;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  CALL sp_log('Updating surface factors for active players...');

  -- 1) Nollställ ALLA spelare
  UPDATE players
     SET grass_factor = NULL,
         clay_factor  = NULL,
         hard_factor  = NULL;

  -- 2) Uppdatera endast aktiva
  OPEN player_cursor;

  player_loop: LOOP
    FETCH player_cursor INTO current_player_id;
    IF done THEN
      LEAVE player_loop;
    END IF;

    CALL sp_update_surface_factors_for_player(current_player_id);
  END LOOP;

  CLOSE player_cursor;
END;;
DELIMITER ;
