-- Add the ATP tournament edition independently of prices and player identities.
ALTER TABLE odds
  ADD COLUMN event VARCHAR(20) NULL COMMENT 'ATP tournament edition; events.id' AFTER tournament,
  ADD KEY odds_event (event);

-- Metadata only: preserve every stored price and scheduled match time.
UPDATE odds o SET event = (
  SELECT CASE WHEN COUNT(*)=1 THEN NULLIF(MIN(e.id),'') END
  FROM events e
  WHERE e.name = CASE LOWER(TRIM(o.tournament))
    WHEN 'wien' THEN 'Vienna' WHEN 'rom' THEN 'Rome'
    WHEN 'paris masters' THEN 'Paris' ELSE TRIM(o.tournament) END
  AND e.date BETWEEN DATE_SUB(DATE(o.time), INTERVAL 20 DAY)
                 AND DATE_ADD(DATE(o.time), INTERVAL 7 DAY)
);
