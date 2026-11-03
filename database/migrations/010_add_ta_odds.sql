ALTER TABLE odds
  ADD COLUMN player_ta_odds DECIMAL(12,2) NULL,
  ADD COLUMN opponent_ta_odds DECIMAL(12,2) NULL,
  ADD CONSTRAINT odds_valid_ta_prices CHECK (
    (player_ta_odds IS NULL AND opponent_ta_odds IS NULL)
    OR (player_ta_odds IS NOT NULL AND opponent_ta_odds IS NOT NULL
        AND player_ta_odds >= 1 AND opponent_ta_odds >= 1)
  );
