CREATE FUNCTION MATCH_LOOKUP(
  p_date DATE,
  p_tournament VARCHAR(255),
  p_player_a VARCHAR(255),
  p_player_b VARCHAR(255)
) RETURNS VARCHAR(50)
NOT DETERMINISTIC
READS SQL DATA
SQL SECURITY INVOKER
COMMENT 'Unique ATP match by tournament edition and player pair; missing or ambiguous returns NULL'
BEGIN
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_player_a VARCHAR(50);
  DECLARE v_player_b VARCHAR(50);
  DECLARE v_event VARCHAR(50);
  DECLARE v_match VARCHAR(50);
  DECLARE v_tournament VARCHAR(255);

  IF p_date IS NULL OR NULLIF(TRIM(p_tournament), '') IS NULL
     OR NULLIF(TRIM(p_player_a), '') IS NULL
     OR NULLIF(TRIM(p_player_b), '') IS NULL THEN
    RETURN NULL;
  END IF;

  -- Exact IDs or full names under the database's case/accent-insensitive collation.
  -- Do not use PLAYER_LOOKUP's fuzzy ranking to resolve ambiguous identities.
  SELECT COUNT(*), MIN(id) INTO v_count, v_player_a
  FROM players WHERE id = TRIM(p_player_a) OR name = TRIM(p_player_a);
  IF v_count <> 1 THEN RETURN NULL; END IF;

  SELECT COUNT(*), MIN(id) INTO v_count, v_player_b
  FROM players WHERE id = TRIM(p_player_b) OR name = TRIM(p_player_b);
  IF v_count <> 1 OR v_player_a = v_player_b THEN RETURN NULL; END IF;

  SET v_tournament = CASE LOWER(TRIM(p_tournament))
    WHEN 'wien' THEN 'Vienna'
    WHEN 'rom' THEN 'Rome'
    WHEN 'paris masters' THEN 'Paris'
    ELSE TRIM(p_tournament)
  END;

  -- events.date is the edition start, not the match date. Allow qualifying
  -- up to seven days before it and matches up to twenty days after it.
  SELECT COUNT(*), MIN(id) INTO v_count, v_event
  FROM events
  WHERE (id = TRIM(p_tournament) OR name = v_tournament)
    AND date BETWEEN DATE_SUB(p_date, INTERVAL 20 DAY)
                 AND DATE_ADD(p_date, INTERVAL 7 DAY);
  IF v_count <> 1 THEN RETURN NULL; END IF;

  SELECT COUNT(*), MIN(id) INTO v_count, v_match
  FROM matches
  WHERE event = v_event AND (
    (winner = v_player_a AND loser = v_player_b)
    OR (winner = v_player_b AND loser = v_player_a)
  );
  IF v_count = 1 THEN RETURN v_match; END IF;
  RETURN NULL;
END;
