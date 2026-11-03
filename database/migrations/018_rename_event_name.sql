-- Preserve source names, all prices and event links. Deploy with both collectors.
ALTER TABLE odds
  CHANGE COLUMN tournament event_name VARCHAR(255) DEFAULT NULL;
