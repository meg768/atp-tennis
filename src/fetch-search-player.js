const searchPlayers = require('./search-players.js');

class FetchSearchPlayer {
	constructor(options = {}) {
		this.mysql = options.mysql;
	}

	async fetch({ query, term, limit = 5 } = {}) {
		const searchTerm = String(query ?? term ?? '').trim();
		const candidates = await searchPlayers(this.mysql, searchTerm, limit);

		return {
			query: searchTerm,
			limit: Number(limit),
			candidates
		};
	}

	parse(raw) {
		const candidates = Array.isArray(raw?.candidates) ? raw.candidates : [];
		const topCandidate = candidates[0] || null;
		const nextCandidate = candidates[1] || null;
		const bestGuess = Boolean(topCandidate && nextCandidate) && Number(topCandidate.match_score) === Number(nextCandidate.match_score);

		return {
			query: raw?.query || '',
			limit: Number(raw?.limit || 0),
			totalCandidates: candidates.length,
			bestGuess,
			bestMatch: topCandidate ? {
				id: topCandidate.id,
				name: topCandidate.name,
				country: topCandidate.country,
				rank: topCandidate.rank,
				active: Boolean(topCandidate.active),
				eloRank: topCandidate.elo_rank
			} : null,
			candidates: candidates.map(candidate => ({
				id: candidate.id,
				name: candidate.name,
				country: candidate.country,
				rank: candidate.rank,
				active: Boolean(candidate.active),
				eloRank: candidate.elo_rank,
				eloRankHard: candidate.elo_rank_hard,
				eloRankClay: candidate.elo_rank_clay,
				eloRankGrass: candidate.elo_rank_grass,
				matchScore: Number(candidate.match_score)
			}))
		};
	}
}

module.exports = FetchSearchPlayer;
