async function searchPlayers(mysql, term, limit = 5) {
	const normalized = String(term || '').trim();
	limit = Number(limit);

	if (!normalized) {
		return [];
	}

	if (!Number.isInteger(limit) || limit <= 0 || limit > 50) {
		throw new Error('limit must be an integer between 1 and 50.');
	}

	return await mysql.query({
		sql: `
			SELECT
				id,
				name,
				country,
				rank,
				active,
				elo_rank,
				elo_rank_hard,
				elo_rank_clay,
				elo_rank_grass,
				CASE
					WHEN UPPER(id) = UPPER(?) THEN 1
					WHEN LOWER(name) = LOWER(?) THEN 2
					WHEN LOWER(name) LIKE LOWER(?) THEN 3
					WHEN LOWER(name) LIKE LOWER(?) THEN 4
					ELSE 5
				END AS match_score
			FROM players
			WHERE
				UPPER(id) = UPPER(?)
				OR LOWER(name) = LOWER(?)
				OR LOWER(name) LIKE LOWER(?)
				OR LOWER(name) LIKE LOWER(?)
			ORDER BY
				match_score ASC,
				(active = 1) DESC,
				(rank IS NULL) ASC,
				rank ASC,
				(elo_rank IS NULL) ASC,
				elo_rank DESC,
				name ASC
			LIMIT ?
		`,
		format: [normalized, normalized, `${normalized}%`, `%${normalized}%`, normalized, normalized, `${normalized}%`, `%${normalized}%`, limit]
	});
}

module.exports = searchPlayers;
