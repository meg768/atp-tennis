const HOME_URL = 'https://www.tennisabstract.com/';
const REQUEST_TIMEOUT_MS = 30000;
const DAY_MS = 24 * 60 * 60 * 1000;
const GRAND_SLAM_NAMES = {
	AustralianOpen: 'Australian Open',
	RolandGarros: 'Roland Garros',
	FrenchOpen: 'Roland Garros',
	Wimbledon: 'Wimbledon',
	USOpen: 'US Open'
};

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
	const tournaments = new Map();
	const patterns = [
		{
			pattern: /href=["'](https:\/\/www\.tennisabstract\.com\/current\/(\d{4})ATP([^"']+)\.html)["']/gi,
			parse: match => ({
				year: Number(match[2]),
				slug: match[3],
				name: match[3],
				sourceType: 'atp'
			})
		},
		{
			pattern: /href=["'](https:\/\/www\.tennisabstract\.com\/current\/(\d{4})(AustralianOpen|RolandGarros|FrenchOpen|Wimbledon|USOpen)MenForecast\.html)["']/gi,
			parse: match => ({
				year: Number(match[2]),
				slug: match[3],
				name: GRAND_SLAM_NAMES[match[3]],
				sourceType: 'grand-slam'
			})
		}
	];

	for (const { pattern, parse } of patterns) {
		let match;

		while ((match = pattern.exec(html)) !== null) {
			const sourceUrl = match[1];

			if (!tournaments.has(sourceUrl)) {
				tournaments.set(sourceUrl, {
					id: null,
					...parse(match),
					tour: 'ATP',
					status: 'active',
					sourceUrl
				});
			}
		}
	}

	return [...tournaments.values()];
}

function filterCurrentGrandSlams(tournaments, now = new Date()) {
	const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

	return tournaments.filter(tournament => {
		if (tournament.sourceType !== 'grand-slam') {
			return true;
		}

		if (!tournament.date) {
			return false;
		}

		const start = Date.parse(`${tournament.date}T00:00:00Z`);
		const daysSinceStart = (today - start) / DAY_MS;

		return daysSinceStart >= -7 && daysSinceStart <= 15;
	});
}

async function addEventIds(tournaments, mysql) {
	if (tournaments.length === 0) {
		return [];
	}

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
		delete output.slug;

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
		const table = html.match(/<table[^>]*>\s*<tr><td>Player<\/td>[\s\S]*?<\/table>/i);
		drawHtml = table?.[0] || null;
	}

	if (!drawHtml) {
		throw new Error('Could not find a main-draw forecast in the Tennis Abstract page.');
	}

	const playerPattern = /(?:\(([^)]+)\))?\s*<a\s+href=["']https?:\/\/www\.tennisabstract\.com\/cgi-bin\/player\.cgi\?p=([^\/"'&]+)(?:\/[^"']*)?["'][^>]*>([^<]+)<\/a>\s*\(([A-Z]{3})\)/gi;
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

	if (players.size === 0) {
		throw new Error('The main-draw forecast did not contain any readable players.');
	}

	return [...players.values()];
}

async function addAtpIds(tournaments, mysql) {
	if (tournaments.length === 0) {
		return [];
	}

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
		delete event.sourceType;

		return { ...event, players };
	});
}

function createPayload(events = [], errors = []) {
	return {
		timestamp: new Date().toISOString(),
		source: 'TA',
		status: errors.length === 0 ? 'complete' : events.length > 0 ? 'partial' : 'error',
		events,
		errors
	};
}

async function getCurrentEvents({ mysql }) {
	if (!mysql) {
		throw new Error('MySQL is required.');
	}

	const homeHtml = await fetchText(HOME_URL);
	let current = findCurrentAtpTournaments(homeHtml);

	if (current.length === 0) {
		return createPayload();
	}

	current = await addEventIds(current, mysql);
	current = filterCurrentGrandSlams(current);

	if (current.length === 0) {
		return createPayload();
	}

	const results = await Promise.all(
		current.map(async tournament => {
			try {
				const html = await fetchText(tournament.sourceUrl);

				return {
					event: {
						...tournament,
						players: extractMainDraw(html)
					}
				};
			} catch (error) {
				return {
					error: {
						name: tournament.name,
						sourceUrl: tournament.sourceUrl,
						message: error.message
					}
				};
			}
		})
	);
	const errors = results.flatMap(result => (result.error ? [result.error] : []));
	let tournaments = results.flatMap(result => (result.event ? [result.event] : []));

	if (tournaments.length === 0 && errors.length > 0) {
		throw new Error(`Could not parse any current Tennis Abstract tournaments: ${errors.map(error => error.message).join('; ')}`);
	}

	tournaments = await addAtpIds(tournaments, mysql);

	return createPayload(tournaments, errors);
}

module.exports = {
	extractMainDraw,
	filterCurrentGrandSlams,
	findCurrentAtpTournaments,
	getCurrentEvents
};
