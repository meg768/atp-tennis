DROP PROCEDURE IF EXISTS sp_update_surface_factors_for_player;

DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `sp_update_surface_factors_for_player`(IN player_id VARCHAR(50))
BEGIN
  DECLARE clay_wins INT DEFAULT 0;
  DECLARE clay_matches INT DEFAULT 0;
  DECLARE hard_wins INT DEFAULT 0;
  DECLARE hard_matches INT DEFAULT 0;
  DECLARE grass_wins INT DEFAULT 0;
  DECLARE grass_matches INT DEFAULT 0;
  DECLARE clay_factor TINYINT;
  DECLARE hard_factor TINYINT;
  DECLARE grass_factor TINYINT;


  -- Drop and recreate temporary table
  DROP TEMPORARY TABLE IF EXISTS recent_matches;

  CREATE TEMPORARY TABLE recent_matches AS
  SELECT *
  FROM flatly
  WHERE event_date >= CURDATE() - INTERVAL 2 YEAR;

  -- Clay
  SELECT COUNT(*) INTO clay_wins
  FROM recent_matches
  WHERE event_surface = 'Clay' AND winner_id = player_id;

  SELECT COUNT(*) INTO clay_matches
  FROM recent_matches
  WHERE event_surface = 'Clay' AND (winner_id = player_id OR loser_id = player_id);

  -- Hard
  SELECT COUNT(*) INTO hard_wins
  FROM recent_matches
  WHERE event_surface = 'Hard' AND winner_id = player_id;

  SELECT COUNT(*) INTO hard_matches
  FROM recent_matches
  WHERE event_surface = 'Hard' AND (winner_id = player_id OR loser_id = player_id);

  -- Grass
  SELECT COUNT(*) INTO grass_wins
  FROM recent_matches
  WHERE event_surface = 'Grass' AND winner_id = player_id;

  SELECT COUNT(*) INTO grass_matches
  FROM recent_matches
  WHERE event_surface = 'Grass' AND (winner_id = player_id OR loser_id = player_id);

  -- Surface factors (win percentages)
  SET clay_factor = CASE WHEN clay_matches = 0 THEN NULL ELSE ROUND(clay_wins * 100 / clay_matches, 0) END;
  SET hard_factor = CASE WHEN hard_matches = 0 THEN NULL ELSE ROUND(hard_wins * 100 / hard_matches, 0) END;
  SET grass_factor = CASE WHEN grass_matches = 0 THEN NULL ELSE ROUND(grass_wins * 100 / grass_matches, 0) END;

  -- Update players table
  UPDATE players
  SET
    clay_factor = clay_factor,
    hard_factor = hard_factor,
    grass_factor = grass_factor
  WHERE id = player_id;

  -- Cleanup
  DROP TEMPORARY TABLE IF EXISTS recent_matches;
END;;
DELIMITER ;
