-- DATETIME retains the full scheduled start, normalized to UTC by both collectors.
-- Existing values are preserved; eligible pre-match updates supply actual times.
ALTER TABLE odds
  CHANGE COLUMN date time DATETIME NULL COMMENT 'UTC: scheduled match start';
