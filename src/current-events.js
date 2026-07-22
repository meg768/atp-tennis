const HOME_URL = 'https://www.tennisabstract.com/';
const REQUEST_TIMEOUT_MS = 30000;

function decodeHtml(value) {
	return String(value || '')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;|&apos;/gi, "'")
		.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
		.replace(/\s+/g, ' ')
		.trim();
}

async function fetchText(url) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(url, {
			headers: {
				Accept: 'text/html,application/xhtml+xml',
				'User-Agent': 'atp-tennis/1.0 (+https://github.com/meg768/atp-tennis)'
			},
			signal: controller.signal
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status} for ${url}`);
		}

		return await response.text();
	} finally {
		clearTimeout(timeout);
	}
}

function findCurrentAtpTournaments(html) {
	const pattern = /href=["'](https:\/\/www\.tennisabstract\.com\/current\/(\d{4})ATP([^"']+)\.html)["']/gi;
	const tournaments = new Map();
	let match;

	while ((match = pattern.exec(html)) !== null) {
		const [, sourceUrl, year, slug] = match;

		if (!tournaments.has(sourceUrl)) {
			tournaments.set(sourceUrl, {
				id: null,
				year: Number(year),
				tour: 'ATP',
				slug,
				name: `ATP ${slug.replace(/([a-z])([A-Z])/g, '$1 $2')}`,
				status: 'active',
				sourceUrl
			});
		}
	}

	return [...tournaments.values()];
}

async function addEventIds(tournaments, mysql) {
	const years = [...new Set(tournaments.map(tournament => tournament.year))];
	const placeholders = years.map(() => '?').join(', ');
	const rows = await mysql.query({
		sql: `
			SELECT id, name, DATE_FORMAT(date, '%Y-%m-%d') AS date, location, type, surface, url
			FROM events
			WHERE LEFT(id, 4) IN (${placeholders})
		`,
		format: years.map(String)
	});

	function normalize(value) {
		return String(value || '')
			.toLocaleLowerCase('en-US')
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '');
	}

	return tournaments.map(tournament => {
		const slug = normalize(tournament.slug);
		const event = rows.find(row => String(row.id).startsWith(`${tournament.year}-`) && normalize(row.name) === slug);
		const output = { ...tournament };
		delete output.year;

		return {
			...output,
			id: event?.id || null,
			name: tournament.name,
			date: event?.date || null,
			location: event?.location || null,
			type: event?.type || null,
			surface: event?.surface || null,
			url: event?.url || null
		};
	});
}

function extractMainDraw(html) {
	const drawSizes = [128, 96, 64, 56, 48, 32, 28, 16, 8, 4, 2];
	let drawHtml = null;

	for (const size of drawSizes) {
		const pattern = new RegExp(`var\\s+proj${size}\\s*=\\s*'([\\s\\S]*?)';`);
		const match = html.match(pattern);

		if (match) {
			drawHtml = match[1];
			break;
		}
	}

	if (!drawHtml) {
		throw new Error('Could not find a main-draw forecast in the Tennis Abstract page.');
	}

	const playerPattern = /(?:\(([^)]+)\))?<a\s+href=["']https?:\/\/www\.tennisabstract\.com\/cgi-bin\/player\.cgi\?p=(\d+)\/[^"']+["'][^>]*>([^<]+)<\/a>\s*\(([A-Z]{3})\)/gi;
	const players = new Map();
	let match;

	while ((match = playerPattern.exec(drawHtml)) !== null) {
		const [, marker, tennisAbstractId, rawName, country] = match;
		const entry = marker && !/^\d+$/.test(marker) ? marker : null;
		const seed = marker && /^\d+$/.test(marker) ? Number(marker) : null;

		if (!players.has(tennisAbstractId)) {
			players.set(tennisAbstractId, {
				name: decodeHtml(rawName),
				country,
				seed,
				entry
			});
		}
	}

	return [...players.values()];
}

function extractPageName(html, fallback) {
	const match = html.match(/<title>\s*Tennis Abstract:\s*\d{4}\s+(ATP\s+.*?)\s+(?:Results|Forecast)/i);
	return decodeHtml(match?.[1] || fallback);
}

async function addAtpIds(tournaments, mysql) {
	const names = [...new Set(tournaments.flatMap(tournament => tournament.players.map(player => player.name)))];
	const sql = names.map(() => 'SELECT ? AS name, PLAYER_LOOKUP(?) AS id').join('\nUNION ALL\n');
	const format = names.flatMap(name => [name, name]);
	const rows = await mysql.query({ sql, format });
	const atpIds = new Map(rows.map(row => [row.name, row.id || null]));
	const unmatched = tournaments.flatMap(tournament => tournament.players).filter(player => !atpIds.get(player.name));

	function tokens(value) {
		return new Set(
			value
				.toLocaleLowerCase('en-US')
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.split(/[^a-z0-9]+/)
				.filter(Boolean)
		);
	}

	for (const player of unmatched) {
		const parts = player.name.split(/\s+/).filter(Boolean);
		const candidates = [...new Set([parts.slice(0, -1).join(' '), parts.at(-1)].filter(Boolean))];
		const originalTokens = tokens(player.name);
		let best = null;

		for (const candidate of candidates) {
			const candidateRows = await mysql.query({
				sql: `
					SELECT p.id, p.name, p.country
					FROM players p
					WHERE p.id = PLAYER_LOOKUP(?)
				`,
				format: [candidate]
			});
			const resolved = candidateRows[0];

			if (!resolved || resolved.country !== player.country) {
				continue;
			}

			const overlap = [...tokens(resolved.name)].filter(token => originalTokens.has(token)).length;

			if (!best || overlap > best.overlap) {
				best = { id: resolved.id, overlap };
			}
		}

		if (best?.overlap > 0) {
			atpIds.set(player.name, best.id);
		}
	}

	return tournaments.map(tournament => {
		const players = tournament.players.map(player => ({
			id: atpIds.get(player.name) ?? null,
			...player
		}));

		players.sort((a, b) => {
			if (a.seed != null && b.seed != null) {
				return a.seed - b.seed;
			}

			if (a.seed != null) {
				return -1;
			}

			if (b.seed != null) {
				return 1;
			}

			return 0;
		});

		const event = { ...tournament };
		delete event.players;

		return { ...event, players };
	});
}

async function getCurrentEvents({ mysql }) {
	if (!mysql) {
		throw new Error('MySQL is required.');
	}

	const homeHtml = await fetchText(HOME_URL);
	const current = findCurrentAtpTournaments(homeHtml);

	if (current.length === 0) {
		throw new Error('No current ATP tournaments were found on Tennis Abstract.');
	}

	let tournaments = await Promise.all(
		current.map(async tournament => {
			const html = await fetchText(tournament.sourceUrl);

			return {
				...tournament,
				name: extractPageName(html, tournament.name),
				players: extractMainDraw(html)
			};
		})
	);

	tournaments = await addEventIds(tournaments, mysql);
	tournaments = await addAtpIds(tournaments, mysql);

	const payload = {
		timestamp: new Date().toISOString(),
		source: 'TA',
		status: 'complete',
		events: tournaments,
		errors: []
	};

	return payload;
}

module.exports = { getCurrentEvents };
