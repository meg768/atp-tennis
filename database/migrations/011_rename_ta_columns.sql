-- Rename only; retain all existing values and the paired-price constraint.
ALTER TABLE odds
  DROP CONSTRAINT odds_valid_ta_prices,
  CHANGE COLUMN player_ta_odds player_ta DECIMAL(12,2) NULL,
  CHANGE COLUMN opponent_ta_odds opponent_ta DECIMAL(12,2) NULL,
  ADD CONSTRAINT odds_valid_ta_prices CHECK (
    (player_ta IS NULL AND opponent_ta IS NULL)
    OR (player_ta IS NOT NULL AND opponent_ta IS NOT NULL
        AND player_ta >= 1 AND opponent_ta >= 1)
  );
