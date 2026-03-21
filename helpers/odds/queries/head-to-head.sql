/*
@name Head-to-head
@description Jämför tidigare inbördes möten och låter spelaren med flest vinster vinna queryn.
@weight 1
*/

SET @playerA = :playerA;
SET @playerB = :playerB;

WITH player_names AS (
	SELECT id, name
	FROM players
	WHERE id IN (@playerA, @playerB)
),
head_to_head AS (
	SELECT
		SUM(CASE WHEN winner = @playerA THEN 1 ELSE 0 END) AS wins_a,
		SUM(CASE WHEN winner = @playerB THEN 1 ELSE 0 END) AS wins_b
	FROM matches
	WHERE
		(winner = @playerA AND loser = @playerB)
		OR
		(winner = @playerB AND loser = @playerA)
)
SELECT
	CASE
		WHEN h.wins_a > h.wins_b THEN 'A'
		WHEN h.wins_b > h.wins_a THEN 'B'
		ELSE NULL
	END AS winner,
	CONCAT(a.name, ': ', COALESCE(h.wins_a, 0), ' | ', b.name, ': ', COALESCE(h.wins_b, 0)) AS summary
FROM head_to_head h
JOIN player_names a ON a.id = @playerA
JOIN player_names b ON b.id = @playerB;
