-- ATP identifiers are independent of TA availability. Preserve all saved prices.
ALTER TABLE odds
  ADD COLUMN player_id VARCHAR(32) NULL AFTER opponent_oddset,
  ADD COLUMN opponent_id VARCHAR(32) NULL AFTER player_id,
  ADD KEY odds_player_id (player_id),
  ADD KEY odds_opponent_id (opponent_id);

-- Metadata backfill only: never calculate or replace historical odds.
UPDATE odds o SET
  player_id = (SELECT CASE WHEN COUNT(*)=1 THEN NULLIF(MIN(p.id),'') END
               FROM players p WHERE p.id=o.player OR p.name=o.player),
  opponent_id = (SELECT CASE WHEN COUNT(*)=1 THEN NULLIF(MIN(p.id),'') END
                 FROM players p WHERE p.id=o.opponent OR p.name=o.opponent);
