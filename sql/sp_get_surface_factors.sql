DROP PROCEDURE IF EXISTS sp_get_surface_factors;

DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `sp_get_surface_factors`(IN player_id VARCHAR(50))
BEGIN
  DECLARE clay_wins INT DEFAULT 0;
  DECLARE clay_matches INT DEFAULT 0;
  DECLARE hard_wins INT DEFAULT 0;
  DECLARE hard_matches INT DEFAULT 0;
  DECLARE grass_wins INT DEFAULT 0;
  DECLARE grass_matches INT DEFAULT 0;
  DECLARE total_wins INT;
  DECLARE total_matches INT;

  -- Ensure no conflict from existing temp table
  DROP TEMPORARY TABLE IF EXISTS recent_matches;

  -- Create a temporary table with filtered matches from the last 20 years
  CREATE TEMPORARY TABLE recent_matches AS
  SELECT *
  FROM flatly
  WHERE event_date >= CURDATE() - INTERVAL 20 YEAR;

  -- Clay surface stats
  SELECT COUNT(*) INTO clay_wins
  FROM recent_matches
  WHERE event_surface = 'Clay' AND winner_id = player_id;

  SELECT COUNT(*) INTO clay_matches
  FROM recent_matches
  WHERE event_surface = 'Clay' AND (winner_id = player_id OR loser_id = player_id);

  -- Hard surface stats
  SELECT COUNT(*) INTO hard_wins
  FROM recent_matches
  WHERE event_surface = 'Hard' AND winner_id = player_id;

  SELECT COUNT(*) INTO hard_matches
  FROM recent_matches
  WHERE event_surface = 'Hard' AND (winner_id = player_id OR loser_id = player_id);

  -- Grass surface stats
  SELECT COUNT(*) INTO grass_wins
  FROM recent_matches
  WHERE event_surface = 'Grass' AND winner_id = player_id;

  SELECT COUNT(*) INTO grass_matches
  FROM recent_matches
  WHERE event_surface = 'Grass' AND (winner_id = player_id OR loser_id = player_id);

  -- Totals
  SET total_wins = clay_wins + hard_wins + grass_wins;
  SET total_matches = clay_matches + hard_matches + grass_matches;

  -- Return surface factors and totals
  SELECT
    CASE WHEN clay_matches = 0 THEN NULL ELSE ROUND(clay_wins * 100 / clay_matches, 0) END AS clay_factor,
    CASE WHEN hard_matches = 0 THEN NULL ELSE ROUND(hard_wins * 100 / hard_matches, 0) END AS hard_factor,
    CASE WHEN grass_matches = 0 THEN NULL ELSE ROUND(grass_wins * 100 / grass_matches, 0) END AS grass_factor,
    total_wins,
    total_matches;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS recent_matches;
END;;
DELIMITER ;


CALL sp_get_surface_factors('RH16');