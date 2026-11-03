-- ATP identifiers now use player/opponent; display names stay in *_name.
-- Existing values, nullability and indexes are preserved.
ALTER TABLE odds
  CHANGE COLUMN player_id player VARCHAR(32) NULL,
  CHANGE COLUMN opponent_id opponent VARCHAR(32) NULL;
