/*
@name ATP-rank
@description Jämför spelarnas aktuella ATP-rank och låter lägst ranktal vinna queryn.
@weight 0.7
*/

SET @playerA = :playerA;
SET @playerB = :playerB;

WITH players_in_matchup AS (
	SELECT id, name, rank
	FROM players
	WHERE id IN (@playerA, @playerB)
)
SELECT
	CASE
		WHEN a.rank IS NULL OR b.rank IS NULL THEN NULL
		WHEN a.rank < b.rank THEN 'A'
		WHEN b.rank < a.rank THEN 'B'
		ELSE NULL
	END AS winner,
	CONCAT(a.name, ': #', a.rank, ' | ', b.name, ': #', b.rank) AS summary
FROM players_in_matchup a
JOIN players_in_matchup b ON b.id = @playerB
WHERE a.id = @playerA;
