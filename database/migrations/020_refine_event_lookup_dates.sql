CREATE OR REPLACE FUNCTION EVENT_LOOKUP(
  p_date DATE,
  p_name VARCHAR(255)
) RETURNS VARCHAR(20)
NOT DETERMINISTIC
READS SQL DATA
SQL SECURITY INVOKER
COMMENT 'ATP event edition by name and match date; unresolved or ambiguous returns NULL'
BEGIN
  DECLARE v_name VARCHAR(255) DEFAULT TRIM(p_name);
  DECLARE v_alias VARCHAR(255);

  IF p_date IS NULL OR NULLIF(v_name, '') IS NULL THEN RETURN NULL; END IF;

  SET v_alias = CASE LOWER(v_name)
    WHEN 'wien' THEN 'Vienna'
    WHEN 'rom' THEN 'Rome'
    ELSE REGEXP_REPLACE(LOWER(v_name), '[[:space:]]+(open|masters)$', '')
  END;

  -- Use the wider window for a unique match. In a tie, use narrower
  -- windows and require the remaining edition to have started.
  RETURN (
    SELECT CASE
      WHEN COUNT(*) = 1 THEN NULLIF(MIN(id), '')
      WHEN SUM(in_narrow_window) = 1 THEN
        NULLIF(MIN(CASE WHEN in_narrow_window AND date <= p_date THEN id END), '')
    END
    FROM (
      SELECT id, date, CASE WHEN id = v_name OR name = v_name THEN 0 ELSE 1 END AS name_priority,
             date >= CASE
               WHEN type IN ('ATP-250', 'ATP-500', 'Challenger') THEN DATE_SUB(p_date, INTERVAL 10 DAY)
               ELSE DATE_SUB(p_date, INTERVAL 14 DAY)
             END AS in_narrow_window
      FROM events
      WHERE date BETWEEN DATE_SUB(p_date, INTERVAL 20 DAY) AND DATE_ADD(p_date, INTERVAL 7 DAY)
        AND (id = v_name OR name = v_name
          OR (name = v_alias AND (LOWER(v_name) NOT LIKE '% masters' OR type = 'Masters')))
    ) AS candidates
    GROUP BY name_priority
    ORDER BY name_priority
    LIMIT 1
  );
END;
