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
  event = COALESCE(o.event, EVENT_LOOKUP(DATE(o.time), o.event_name))
WHERE o.player IS NULL OR o.opponent IS NULL OR o.event IS NULL;
