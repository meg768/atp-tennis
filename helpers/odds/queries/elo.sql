/*
@name Total ELO
@description Jämför spelarnas totala ELO-rating och låter högst värde vinna queryn.
@weight 0.5
*/

SET @playerA = :playerA;
SET @playerB = :playerB;

WITH players_in_matchup AS (
	SELECT id, name, elo_rank
	FROM players
	WHERE id IN (@playerA, @playerB)
)
SELECT
	CASE
		WHEN a.elo_rank IS NULL OR b.elo_rank IS NULL THEN NULL
		WHEN a.elo_rank > b.elo_rank THEN 'A'
		WHEN b.elo_rank > a.elo_rank THEN 'B'
		ELSE NULL
	END AS winner,
	CONCAT(a.name, ': ', ROUND(a.elo_rank, 1), ' | ', b.name, ': ', ROUND(b.elo_rank, 1)) AS summary
FROM players_in_matchup a
JOIN players_in_matchup b ON b.id = @playerB
WHERE a.id = @playerA;
