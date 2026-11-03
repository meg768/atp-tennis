-- Rename only; retain every stored price and its validation rule.
ALTER TABLE odds
  DROP CONSTRAINT odds_valid_prices,
  CHANGE COLUMN player_odds player_oddset DECIMAL(12,3) NULL,
  CHANGE COLUMN opponent_odds opponent_oddset DECIMAL(12,3) NULL,
  ADD CONSTRAINT odds_valid_prices CHECK (player_oddset > 0 AND opponent_oddset > 0);
