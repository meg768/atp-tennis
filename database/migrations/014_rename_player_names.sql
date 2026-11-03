-- Rename only; preserve names, ATP ids and every stored price.
ALTER TABLE odds
  CHANGE COLUMN player player_name VARCHAR(255) NULL,
  CHANGE COLUMN opponent opponent_name VARCHAR(255) NULL;
