class FetchHeadToHead {
	constructor(options = {}) {
		this.mysql = options.mysql;
	}

	async findPlayers(term) {
		const normalized = String(term || '').trim();

		if (!normalized) {
			return [];
		}

		return await this.mysql.query({
			sql: `
				SELECT
					id,
					name,
					country,
					rank,
					active,
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
					name ASC
				LIMIT 5
			`,
			format: [normalized, normalized, `${normalized}%`, `%${normalized}%`, normalized, normalized, `${normalized}%`, `%${normalized}%`]
		});
	}

	async resolvePlayer(label, term) {
		const rows = await this.findPlayers(term);

		if (rows.length === 0) {
			throw new Error(`Player not found: ${term}`);
		}

		const player = rows[0];
		const next = rows[1];
		const bestGuess = Boolean(next) && Number(next.match_score) === Number(player.match_score);

		return {
			player,
			searchTerm: String(term || '').trim(),
			bestGuess
		};
	}

	async getOverallStats(playerAId, playerBId, surface) {
		let sql = `
			SELECT
				SUM(CASE WHEN m.winner = ? THEN 1 ELSE 0 END) AS winsA,
				SUM(CASE WHEN m.winner = ? THEN 1 ELSE 0 END) AS winsB,
				COUNT(*) AS totalMatches
			FROM matches m
			JOIN events e ON e.id = m.event
			WHERE
				m.status = 'Completed'
				AND (
					(m.winner = ? AND m.loser = ?)
					OR
					(m.winner = ? AND m.loser = ?)
				)
		`;

		const format = [playerAId, playerBId, playerAId, playerBId, playerBId, playerAId];

		if (surface) {
			sql += ` AND e.surface = ?`;
			format.push(surface);
		}

		const rows = await this.mysql.query({ sql, format });
		const row = rows[0] || {};

		return {
			winsA: Number(row.winsA || 0),
			winsB: Number(row.winsB || 0),
			totalMatches: Number(row.totalMatches || 0)
		};
	}

	async getSurfaceBreakdown(playerAId, playerBId) {
		const rows = await this.mysql.query({
			sql: `
				SELECT
					COALESCE(e.surface, 'Unknown') AS surface,
					SUM(CASE WHEN m.winner = ? THEN 1 ELSE 0 END) AS winsA,
					SUM(CASE WHEN m.winner = ? THEN 1 ELSE 0 END) AS winsB,
					COUNT(*) AS totalMatches
				FROM matches m
				JOIN events e ON e.id = m.event
				WHERE
					m.status = 'Completed'
					AND (
						(m.winner = ? AND m.loser = ?)
						OR
						(m.winner = ? AND m.loser = ?)
					)
				GROUP BY COALESCE(e.surface, 'Unknown')
				ORDER BY totalMatches DESC, surface ASC
			`,
			format: [playerAId, playerBId, playerAId, playerBId, playerBId, playerAId]
		});

		return rows.map(row => ({
			surface: row.surface,
			winsA: Number(row.winsA || 0),
			winsB: Number(row.winsB || 0),
			totalMatches: Number(row.totalMatches || 0)
		}));
	}

	async getRecentMatches(playerAId, playerBId, surface, limit) {
		let sql = `
			SELECT
				m.id,
				e.date,
				e.id AS eventId,
				e.name AS eventName,
				e.surface,
				m.round,
				m.score,
				m.status,
				m.duration,
				winner.id AS winnerId,
				winner.name AS winnerName,
				loser.id AS loserId,
				loser.name AS loserName
			FROM matches m
			JOIN events e ON e.id = m.event
			LEFT JOIN players winner ON winner.id = m.winner
			LEFT JOIN players loser ON loser.id = m.loser
			WHERE
				m.status = 'Completed'
				AND (
					(m.winner = ? AND m.loser = ?)
					OR
					(m.winner = ? AND m.loser = ?)
				)
		`;

		const format = [playerAId, playerBId, playerBId, playerAId];

		if (surface) {
			sql += ` AND e.surface = ?`;
			format.push(surface);
		}

		sql += ` ORDER BY e.date DESC, m.id DESC LIMIT ?`;
		format.push(limit);

		const rows = await this.mysql.query({ sql, format });

		return rows.map(row => ({
			id: row.id,
			date: row.date,
			event: {
				id: row.eventId,
				name: row.eventName,
				surface: row.surface
			},
			round: row.round,
			score: row.score,
			status: row.status,
			duration: row.duration,
			winner: {
				id: row.winnerId,
				name: row.winnerName
			},
			loser: {
				id: row.loserId,
				name: row.loserName
			}
		}));
	}

	async fetch({ playerA, playerB, surface = null, limit = 10 } = {}) {
		playerA = String(playerA || '').trim();
		playerB = String(playerB || '').trim();
		limit = Number(limit);

		if (!playerA || !playerB) {
			throw new Error('playerA and playerB parameters are required.');
		}

		if (playerA.toUpperCase() === playerB.toUpperCase()) {
			throw new Error('playerA and playerB must be different.');
		}

		if (!Number.isInteger(limit) || limit <= 0 || limit > 50) {
			throw new Error('limit must be an integer between 1 and 50.');
		}

		const [resolvedA, resolvedB] = await Promise.all([
			this.resolvePlayer('playerA', playerA),
			this.resolvePlayer('playerB', playerB)
		]);

		if (String(resolvedA.player.id).toUpperCase() === String(resolvedB.player.id).toUpperCase()) {
			throw new Error('playerA and playerB resolved to the same player.');
		}

		const [overall, bySurface, recentMatches] = await Promise.all([
			this.getOverallStats(resolvedA.player.id, resolvedB.player.id, surface),
			this.getSurfaceBreakdown(resolvedA.player.id, resolvedB.player.id),
			this.getRecentMatches(resolvedA.player.id, resolvedB.player.id, surface, limit)
		]);

		return {
			playerA: {
				searchTerm: resolvedA.searchTerm,
				player: resolvedA.player,
				bestGuess: resolvedA.bestGuess
			},
			playerB: {
				searchTerm: resolvedB.searchTerm,
				player: resolvedB.player,
				bestGuess: resolvedB.bestGuess
			},
			filters: {
				surface: surface || null,
				limit
			},
			overall: {
				winsA: overall.winsA,
				winsB: overall.winsB,
				totalMatches: overall.totalMatches,
				leader:
					overall.winsA > overall.winsB ? 'A' :
					overall.winsB > overall.winsA ? 'B' :
					null
			},
			bySurface,
			recentMatches
		};
	}

	parse(raw) {
		return {
			playerA: {
				searchTerm: raw.playerA.searchTerm,
				id: raw.playerA.player.id,
				name: raw.playerA.player.name,
				country: raw.playerA.player.country,
				rank: raw.playerA.player.rank,
				bestGuess: raw.playerA.bestGuess
			},
			playerB: {
				searchTerm: raw.playerB.searchTerm,
				id: raw.playerB.player.id,
				name: raw.playerB.player.name,
				country: raw.playerB.player.country,
				rank: raw.playerB.player.rank,
				bestGuess: raw.playerB.bestGuess
			},
			filters: raw.filters,
			overall: {
				winsA: raw.overall.winsA,
				winsB: raw.overall.winsB,
				totalMatches: raw.overall.totalMatches,
				leader:
					raw.overall.winsA > raw.overall.winsB ? 'A' :
					raw.overall.winsB > raw.overall.winsA ? 'B' :
					null
			},
			bySurface: raw.bySurface,
			recentMatches: raw.recentMatches
		};
	}
}

module.exports = FetchHeadToHead;
