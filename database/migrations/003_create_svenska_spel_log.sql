-- Current standalone schema. Earlier 001/002 are historical designs.
-- Requires that odds and odds_feeds do not exist; never drops existing data.
CREATE TABLE odds (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  observed_at DATETIME(6) NOT NULL COMMENT 'UTC: actual retrieval time',
  ss_event_id BIGINT UNSIGNED NOT NULL,
  tournament VARCHAR(255) NULL,
  scheduled_start DATETIME(6) NULL COMMENT 'UTC: preliminary start at observation time',
  match_state VARCHAR(32) NULL,
  player_a_name VARCHAR(255) NOT NULL COMMENT 'Provider home name at observation time',
  player_b_name VARCHAR(255) NOT NULL COMMENT 'Provider away name at observation time',
  ss_odds_a DECIMAL(12,3) NOT NULL,
  ss_odds_b DECIMAL(12,3) NOT NULL,
  ss_offer_id BIGINT UNSIGNED NOT NULL,
  ss_outcome_a_id BIGINT UNSIGNED NOT NULL,
  ss_outcome_b_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY odds_observation (ss_event_id, ss_offer_id, observed_at),
  KEY odds_time (observed_at),
  CONSTRAINT odds_valid_prices CHECK (ss_odds_a > 0 AND ss_odds_b > 0),
  CONSTRAINT odds_distinct_outcomes CHECK (ss_outcome_a_id <> ss_outcome_b_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Immutable Svenska Spel ATP match odds; provider names, no ATP identity matching; times UTC';

CREATE TABLE odds_feeds (
  observed_at DATETIME(6) NOT NULL COMMENT 'UTC: same retrieval time as odds.observed_at',
  source_url TEXT NOT NULL,
  payload LONGTEXT NOT NULL,
  PRIMARY KEY (observed_at),
  CONSTRAINT odds_feed_valid_json CHECK (JSON_VALID(payload))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Original Svenska Spel ATP responses, including retrievals without open match odds';
