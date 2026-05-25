let cache = null;
let cacheAt = 0;
let cacheKey = null;
const cacheTime = 30 * 1000;
const DEFAULT_ATP_MATCHES_URL =
	'https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/listView/tennis/atp/all/all/matches.json';
const DEFAULT_TENNIS_MATCHES_URL =
	'https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/listView/tennis/all/all/all/matches.json';
const DEFAULT_LIVE_OPEN_URL =
	'https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/event/live/open.json';

function isNonNegativeNumber(value) {
	return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function buildSetScores(item) {
	const homeSets = item.liveData?.statistics?.sets?.home ?? [];
	const awaySets = item.liveData?.statistics?.sets?.away ?? [];
	const setCount = Math.max(homeSets.length, awaySets.length);
	const scores = [];

	for (let index = 0; index < setCount; index++) {
		const home = homeSets[index];
		const away = awaySets[index];

		if (!isNonNegativeNumber(home) || !isNonNegativeNumber(away)) {
			continue;
		}

		if (home === 0 && away === 0) {
			continue;
		}

		scores.push(`${home}-${away}`);
	}

	return scores;
}

function buildGameScore(item) {
	const home = item.liveData?.score?.home ?? null;
	const away = item.liveData?.score?.away ?? null;

	if (home == null || away == null) {
		return null;
	}

	return `${home}-${away}`;
}

function buildScore(item) {
	if (!item.liveData) {
		return null;
	}

	const setScores = buildSetScores(item);
	const gameScore = buildGameScore(item);
	const score = setScores.join(' ');

	if (gameScore) {
		return score ? `${score} [${gameScore}]` : `[${gameScore}]`;
	}

	return score || null;
}

function normalizeToken(value = '') {
	return String(value).trim().toLowerCase();
}

function eventTerms(item) {
	const path = Array.isArray(item?.event?.path) ? item.event.path : [];
	return path.flatMap(term => [term.termKey, term.name, term.englishName]).map(normalizeToken).filter(Boolean);
}

function isMensGrandSlam(item) {
	const terms = eventTerms(item);

	return terms.includes('grand_slam') && !terms.some(term =>
		term.includes('women') ||
		term.includes('dam') ||
		term.includes('wta')
	);
}

function isAtpFamilyEvent(item) {
	const terms = eventTerms(item);

	return terms.some(term =>
		term === 'atp' ||
		term.startsWith('atp_') ||
		term === 'atp qual.' ||
		term === 'atp qual' ||
		term === 'atp qualifiers' ||
		term === 'challenger' ||
		term === 'challenger_qual_' ||
		term.startsWith('challenger ')
	) || isMensGrandSlam(item);
}

function getMatchOdds(item) {
	return item.betOffers?.find(offer =>
		offer.criterion?.label === 'Matchodds' ||
		offer.criterion?.englishLabel === 'Match Odds'
	) ?? item.mainBetOffer ?? null;
}

function formatOdds(value) {
	return typeof value === 'number' && Number.isFinite(value) ? value / 1000 : null;
}

function normalizeState(state) {
	return state === 'STARTED' ? 'live' : 'upcoming';
}

class Oddset {
	constructor(options = {}) {
		this.url = options.url ?? DEFAULT_ATP_MATCHES_URL;
		this.openUrl = options.openUrl ?? DEFAULT_LIVE_OPEN_URL;
		this.upcomingUrl = options.upcomingUrl ?? DEFAULT_TENNIS_MATCHES_URL;
	}

	buildUrl(url) {
		url = new URL(url);
		url.searchParams.set('channel_id', '1');
		url.searchParams.set('client_id', '200');
		url.searchParams.set('lang', 'sv_SE');
		url.searchParams.set('market', 'SE');

		if (url.pathname.includes('/listView/')) {
			url.searchParams.set('useCombined', 'true');
			url.searchParams.set('useCombinedLive', 'true');
		}

		return url;
	}

	async fetchJson(url) {
		const response = await fetch(this.buildUrl(url), {
			headers: {
				accept: 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status} ${response.statusText}`);
		}

		return await response.json();
	}

	async fetch() {
		const nextCacheKey = [this.url, this.openUrl, this.upcomingUrl].join('|');

		if (cache && cacheKey === nextCacheKey && Date.now() - cacheAt < cacheTime) {
			return cache;
		}

		const errors = {};
		const fetchOptional = async (label, url) => {
			try {
				return await this.fetchJson(url);
			} catch (error) {
				errors[label] = error instanceof Error ? error.message : String(error);
				return null;
			}
		};
		const [matches, open] = await Promise.all([
			fetchOptional('matches', this.url),
			fetchOptional('open', this.openUrl)
		]);
		const hasPrimaryUpcoming = Array.isArray(matches?.events) && matches.events.some(item =>
			item.event?.sport === 'TENNIS' &&
			item.event?.state === 'NOT_STARTED' &&
			isAtpFamilyEvent(item)
		);
		const upcoming = hasPrimaryUpcoming ? null : await fetchOptional('upcoming', this.upcomingUrl);

		if (!matches && !open && !upcoming) {
			throw new Error(Object.values(errors).join(' | ') || 'No Oddset response received');
		}

		cache = {
			matches,
			open,
			upcoming,
			meta: {
				usedUpcomingFallback: Boolean(upcoming),
				primaryEventCount: matches?.events?.length ?? null,
				openEventCount: open?.liveEvents?.length ?? null,
				upcomingEventCount: upcoming?.events?.length ?? null
			},
			errors
		};
		cacheAt = Date.now();
		cacheKey = nextCacheKey;
		return cache;
	}

	async getMatches() {
		let toRows = (items = []) => {
			return items
				.filter(item => item.event?.sport === 'TENNIS')
				.filter(item => isAtpFamilyEvent(item))
				.map(item => {
					let matchOdds = getMatchOdds(item);
					let score = buildScore(item);

					let match = {
						id: item.event.id,
						start: item.event.start,
						tournament: item.event.group,
						playerA: { name: item.event.homeName, odds: formatOdds(matchOdds?.outcomes?.[0]?.odds) },
						playerB: { name: item.event.awayName, odds: formatOdds(matchOdds?.outcomes?.[1]?.odds) },
						state: normalizeState(item.event.state),
						score: item.event.state === 'STARTED' ? (score || 'Live') : null,
						serve: item.liveData ? (item.liveData?.statistics?.sets?.homeServe ? 'player' : 'opponent') : null
					};

					return match;
				})
				.filter(match => match.playerA.name && match.playerB.name);
		};
		const raw = await this.fetch();
		const rows = [
			...toRows(raw.matches?.events),
			...toRows(raw.open?.liveEvents),
			...toRows(raw.upcoming?.events)
		];
		const byId = new Map();

		for (const row of rows) {
			byId.set(String(row.id), row);
		}

		return [...byId.values()].sort((a, b) => Date.parse(a.start || 0) - Date.parse(b.start || 0));
	}

	async getLiveMatches() {
		return (await this.getMatches()).filter(match => match.state === 'live');
	}

	async getUpcomingMatches() {
		return (await this.getMatches()).filter(match => match.state === 'upcoming');
	}
}

module.exports = Oddset;
