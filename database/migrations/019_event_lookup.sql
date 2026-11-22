CREATE FUNCTION EVENT_LOOKUP(
  p_date DATE,
  p_name VARCHAR(255)
) RETURNS VARCHAR(20)
NOT DETERMINISTIC
READS SQL DATA
SQL SECURITY INVOKER
COMMENT 'Unique ATP event edition by match date and name; missing or ambiguous returns NULL'
BEGIN
  DECLARE v_name VARCHAR(255) DEFAULT TRIM(p_name);
  DECLARE v_alias VARCHAR(255);
  DECLARE v_count INT;
  DECLARE v_event VARCHAR(20);
  DECLARE v_from DATE;
  DECLARE v_to DATE;

  IF p_date IS NULL OR NULLIF(v_name, '') IS NULL THEN RETURN NULL; END IF;

  -- events.date is the start of the tournament edition.
  SET v_from = DATE_SUB(p_date, INTERVAL 20 DAY);
  SET v_to = DATE_ADD(p_date, INTERVAL 7 DAY);

  SELECT COUNT(*), NULLIF(MIN(id), '') INTO v_count, v_event
  FROM events
  WHERE date BETWEEN v_from AND v_to AND (id = v_name OR name = v_name);
  IF v_count > 0 THEN RETURN IF(v_count = 1, v_event, NULL); END IF;

  SET v_alias = CASE LOWER(v_name)
    WHEN 'wien' THEN 'Vienna'
    WHEN 'rom' THEN 'Rome'
    ELSE REGEXP_REPLACE(LOWER(v_name), '[[:space:]]+(open|masters)$', '')
  END;
  IF v_alias = v_name THEN RETURN NULL; END IF;

  SELECT COUNT(*), NULLIF(MIN(id), '') INTO v_count, v_event
  FROM events
  WHERE date BETWEEN v_from AND v_to
    AND name = v_alias
    AND (LOWER(v_name) NOT LIKE '% masters' OR type = 'Masters');
  RETURN IF(v_count = 1, v_event, NULL);
END;
