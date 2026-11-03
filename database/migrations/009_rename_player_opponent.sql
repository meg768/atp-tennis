ALTER TABLE odds
  CHANGE COLUMN player_a player VARCHAR(255) NULL,
  CHANGE COLUMN player_b opponent VARCHAR(255) NULL,
  CHANGE COLUMN odds_a player_odds DECIMAL(12,3) NULL,
  CHANGE COLUMN odds_b opponent_odds DECIMAL(12,3) NULL;
