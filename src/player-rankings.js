const GATEWAY_URL = 'https://app.atptour.com/api/gateway/rankings.ranksglrollrange';
const PAGE_URL = 'https://www.atptour.com/en/rankings/singles';

function gatewayUrl(top) {
	return `${GATEWAY_URL}?fromRank=1&toRank=${top}`;
}

function pageUrl(top) {
	return `${PAGE_URL}?rankRange=1-${top}`;
}

function decodeHtml(text) {
	return String(text || '')
		.replace(/&amp;/g, '&')
		.replace(/&#39;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>');
}

function titleCaseSlug(slug) {
	return String(slug || '')
		.split('-')
		.filter(Boolean)
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function splitName(name) {
	const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

	if (parts.length <= 1) {
		return { firstName: '', lastName: parts[0] || '' };
	}

	return {
		firstName: parts.slice(0, -1).join(' '),
		lastName: parts[parts.length - 1]
	};
}

function selectedRankDate(html) {
	const match = String(html || '').match(/<option\b[^>]*selected[^>]*>\s*(\d{4})\.(\d{2})\.(\d{2})\s*<\/option>/i);

	if (!match) {
		return null;
	}

	return `${match[1]}-${match[2]}-${match[3]}T00:00:00`;
}

function parseGateway(raw) {
	if (!raw?.Data?.Rankings?.Players || !Array.isArray(raw.Data.Rankings.Players)) {
		return { players: [] };
	}

	return {
		players: raw.Data.Rankings.Players.map(player => {
			return {
				date: raw.Data.Rankings.RankDate,
				player: player.PlayerId,
				name: `${player.FirstName} ${player.LastName}`,
				age: player.AgeAtRankDate,
				country: player.NatlId,
				rank: player.Rank,
				points: player.Points
			};
		})
	};
}

function parsePage(html, top) {
	const firstTableMatch = String(html || '').match(/<table\b[^>]*\bmobile-table\b[\s\S]*?<\/table>/i);
	const table = firstTableMatch ? firstTableMatch[0] : String(html || '');
	const rankDate = selectedRankDate(html);
	const rows = [];

	for (const rowMatch of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
		const row = rowMatch[1];
		const rankMatch = row.match(/<td\b[^>]*\brank\b[^>]*>\s*([0-9]+)\s*<\/td>/i);
		const playerMatch = row.match(/href="\/en\/players\/([^"/]+)\/([^"/]+)\/overview"/i);
		const countryMatch = row.match(/flags\.svg#flag-([a-z]{3})/i);
		const pointsMatch = row.match(/<td\b[^>]*\bpoints\b[^>]*>[\s\S]*?<a\b[^>]*>\s*([0-9,]+)\s*<\/a>/i);

		if (!rankMatch || !playerMatch || !pointsMatch) {
			continue;
		}

		const name = titleCaseSlug(decodeHtml(playerMatch[1]));
		const { firstName, lastName } = splitName(name);

		rows.push({
			AgeAtRankDate: null,
			FirstName: firstName,
			LastName: lastName,
			NatlId: countryMatch ? countryMatch[1].toUpperCase() : null,
			PlayerId: playerMatch[2].toUpperCase(),
			Points: Number(pointsMatch[1].replace(/,/g, '')),
			Rank: Number(rankMatch[1])
		});

		if (rows.length >= top) {
			break;
		}
	}

	if (rows.length === 0) {
		throw new Error('Failed to parse ATP rankings page fallback.');
	}

	return {
		Data: {
			Rankings: {
				RankDate: rankDate,
				Players: rows
			}
		}
	};
}

module.exports = {
	gatewayUrl,
	pageUrl,
	parseGateway,
	parsePage
};
