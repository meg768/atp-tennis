ALTER TABLE odds
  DROP CONSTRAINT odds_distinct_outcomes,
  DROP COLUMN ss_outcome_a_id;
