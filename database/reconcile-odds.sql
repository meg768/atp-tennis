-- Complete identities after the daily ATP import, even for past/absent matches.
-- Never replace known identities or change source data, times or prices.
UPDATE odds o SET
  player = COALESCE(o.player, (
    SELECT CASE WHEN COUNT(*)=1 THEN NULLIF(MIN(p.id),'') END
    FROM players p WHERE p.id=o.player_name OR p.name=o.player_name
  )),
  opponent = COALESCE(o.opponent, (
    SELECT CASE WHEN COUNT(*)=1 THEN NULLIF(MIN(p.id),'') END
    FROM players p WHERE p.id=o.opponent_name OR p.name=o.opponent_name
  )),
  event = COALESCE(o.event, (
    SELECT CASE WHEN COUNT(*)=1 THEN NULLIF(MIN(e.id),'') END
    FROM events e
    WHERE e.name=CASE LOWER(TRIM(o.event_name))
      WHEN 'wien' THEN 'Vienna' WHEN 'rom' THEN 'Rome'
      WHEN 'paris masters' THEN 'Paris' ELSE TRIM(o.event_name) END
      AND e.date BETWEEN DATE_SUB(DATE(o.time), INTERVAL 20 DAY)
                     AND DATE_ADD(DATE(o.time), INTERVAL 7 DAY)
  ))
WHERE o.player IS NULL OR o.opponent IS NULL OR o.event IS NULL;
