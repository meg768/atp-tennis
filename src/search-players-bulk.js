function normalize(value) {
	return String(value || '').trim().toLowerCase();
}

function matchScore(player, term) {
	const normalizedTerm = normalize(term);
	const id = normalize(player?.id);
	const name = normalize(player?.name);
	const lastName = name.split(' ').at(-1) || '';

	if (id === normalizedTerm) return 1;
	if (name === normalizedTerm) return 2;
	if (lastName === normalizedTerm) return 3;
	if (name.startsWith(normalizedTerm)) return 4;
	if (name.includes(normalizedTerm) || normalizedTerm.includes(name)) return 5;
	return Number.POSITIVE_INFINITY;
}

function compareCandidates(term) {
	return (a, b) => {
		const scoreDifference = matchScore(a, term) - matchScore(b, term);
		if (scoreDifference !== 0) return scoreDifference;

		const activeDifference = Number(Number(b.active) === 1) - Number(Number(a.active) === 1);
		if (activeDifference !== 0) return activeDifference;

		const rankA = a.rank != null && Number.isFinite(Number(a.rank)) ? Number(a.rank) : Number.POSITIVE_INFINITY;
		const rankB = b.rank != null && Number.isFinite(Number(b.rank)) ? Number(b.rank) : Number.POSITIVE_INFINITY;
		if (rankA !== rankB) return rankA - rankB;

		return String(a.name || '').localeCompare(String(b.name || ''));
	};
}

async function searchPlayersBulk(mysql, terms = []) {
	const uniqueTerms = [...new Set(terms.map(term => String(term || '').trim()).filter(Boolean))];
	if (uniqueTerms.length === 0) return {};

	const clauses = [];
	const format = [];

	for (const term of uniqueTerms) {
		clauses.push(`(
			UPPER(id) = UPPER(?)
			OR LOWER(name) LIKE LOWER(?)
			OR LOWER(?) LIKE CONCAT('%', LOWER(name), '%')
		)`);
		format.push(term, `%${term}%`, term);
	}

	const candidates = await mysql.query({
		sql: `
			SELECT id, name, country, rank, active
			FROM players
			WHERE ${clauses.join('\nOR ')}
		`,
		format
	});

	return Object.fromEntries(uniqueTerms.map(term => {
		const matches = candidates
			.filter(player => Number.isFinite(matchScore(player, term)))
			.sort(compareCandidates(term));

		return [term, matches[0] ?? null];
	}));
}

module.exports = searchPlayersBulk;
