-- Upgrade schema 003: retain only the latest row per Svenska Spel event.
-- Run with collector.lock held and preserve a backup before applying.
DELETE older FROM odds older JOIN odds newer
  ON older.ss_event_id = newer.ss_event_id
  AND (older.observed_at < newer.observed_at
       OR (older.observed_at = newer.observed_at AND older.id < newer.id));

ALTER TABLE odds
  DROP INDEX odds_observation,
  DROP PRIMARY KEY,
  DROP COLUMN id,
  CHANGE COLUMN ss_event_id id BIGINT UNSIGNED NOT NULL
    COMMENT 'Svenska Spel event ID; one updatable row per event' FIRST,
  ADD PRIMARY KEY (id),
  MODIFY player_a_name VARCHAR(255) NULL,
  MODIFY player_b_name VARCHAR(255) NULL,
  MODIFY ss_odds_a DECIMAL(12,3) NULL,
  MODIFY ss_odds_b DECIMAL(12,3) NULL,
  MODIFY ss_offer_id BIGINT UNSIGNED NULL,
  MODIFY ss_outcome_a_id BIGINT UNSIGNED NULL,
  MODIFY ss_outcome_b_id BIGINT UNSIGNED NULL,
  COMMENT='Latest known Svenska Spel data per unique event; id is provider event ID; times UTC';
