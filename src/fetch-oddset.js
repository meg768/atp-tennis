const Fetcher = require('./fetcher');

const ODDSET_ATP_MATCHES_URL =
	'https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/listView/tennis/atp/all/all/matches.json?channel_id=1&client_id=200&lang=sv_SE&market=SE&useCombined=true&useCombinedLive=true';
const ODDSET_TENNIS_MATCHES_URL =
	'https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/listView/tennis/all/all/all/matches.json?channel_id=1&client_id=200&lang=sv_SE&market=SE&useCombined=true&useCombinedLive=true';
const ODDSET_LIVE_OPEN_URL =
	'https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/event/live/open.json?lang=sv_SE&market=SE&client_id=200&channel_id=1';

const ODDSET_CURRENT_STATES = ['STARTED', 'NOT_STARTED'];
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const ODDS_SOURCE_PRIORITY = {
	UPCOMING: 1,
	OPEN: 2,
	MATCHES: 3
};

function normalizeStates(states) {
	if (typeof states === 'string') {
		states = states.split(',');
	}

	if (!Array.isArray(states)) {
		return [...ODDSET_CURRENT_STATES];
	}

	const normalized = states
		.map(value => String(value).trim().toUpperCase())
		.filter(Boolean);

	return normalized.length > 0 ? normalized : [...ODDSET_CURRENT_STATES];
}

function isPresent(value) {
	return value !== null && value !== undefined && value !== '';
}

function normalizeName(name = '') {
	return String(name)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9 ]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function createPlayersKey(playerAName, playerBName) {
	const playerA = normalizeName(playerAName);
	const playerB = normalizeName(playerBName);

	if (!playerA || !playerB) {
		return null;
	}

	return [playerA, playerB].sort().join('::');
}

function toDecimalOdds(odds) {
	if (typeof odds !== 'number') {
		return null;
	}

	return Number((odds / 1000).toFixed(2));
}

function parseTimestamp(value) {
	const ts = Date.parse(value);
	return Number.isNaN(ts) ? Number.MAX_SAFE_INTEGER : ts;
}

function getChangedDate(item, one, two) {
	return [one?.changedDate, two?.changedDate, item.mainBetOffer?.changedDate].filter(Boolean).sort().pop() ?? null;
}

function getMatchOddsOffer(item) {
	const fromBetOffers = item.betOffers?.find(offer => offer.criterion?.label === 'Matchodds' || offer.criterion?.englishLabel === 'Match Odds');
	if (fromBetOffers) {
		return fromBetOffers;
	}

	if (item.mainBetOffer?.criterion?.label === 'Matchodds' || item.mainBetOffer?.criterion?.englishLabel === 'Match Odds') {
		return item.mainBetOffer;
	}

	return null;
}

function formatLiveScore(item) {
	const score = item.liveData?.score || {};
	const setHomeScores = item.liveData?.statistics?.sets?.home;
	const setAwayScores = item.liveData?.statistics?.sets?.away;
	const setScores = [];

	if (Array.isArray(setHomeScores) && Array.isArray(setAwayScores)) {
		const length = Math.max(setHomeScores.length, setAwayScores.length);

		for (let index = 0; index < length; index += 1) {
			const home = setHomeScores[index];
			const away = setAwayScores[index];

			if (!Number.isFinite(home) || !Number.isFinite(away)) {
				continue;
			}

			if (home < 0 || away < 0) {
				continue;
			}

			setScores.push(`${home}-${away}`);
		}
	}

	const gameHome = score.home;
	const gameAway = score.away;
	const hasGameScore = gameHome != null && gameAway != null && gameHome !== '' && gameAway !== '';
	const gameScore = hasGameScore ? `[${gameHome}-${gameAway}]` : null;

	if (setScores.length === 0 && !gameScore) {
		return null;
	}

	if (setScores.length > 0 && gameScore) {
		return `${setScores.join(' ')} ${gameScore}`;
	}

	return setScores.length > 0 ? setScores.join(' ') : gameScore;
}

function toKambiRow(item, sourcePriority) {
	const STATE_STARTED = 'STARTED';
	const event = item.event || {};
	const offer = getMatchOddsOffer(item);

	if (!offer) {
		return null;
	}

	const one = offer.outcomes?.find(outcome => outcome.type === 'OT_ONE');
	const two = offer.outcomes?.find(outcome => outcome.type === 'OT_TWO');
	const playerA = one?.label || event.homeName || '-';
	const playerB = two?.label || event.awayName || '-';
	const playersKey = createPlayersKey(playerA, playerB);

	if (!playersKey) {
		return null;
	}

	return {
		id: event.id ?? `${event.name ?? '-'}-${event.start ?? '-'}`,
		tournament: event.group || '-',
		playerA,
		playerB,
		oddsA: toDecimalOdds(one?.odds),
		oddsB: toDecimalOdds(two?.odds),
		state: event.state || null,
		start: event.start || null,
		score: event.state === STATE_STARTED ? formatLiveScore(item) : null,
		_startTimestamp: parseTimestamp(event.start),
		_playersKey: playersKey,
		_changedDate: getChangedDate(item, one, two),
		_sourcePriority: sourcePriority
	};
}

function chooseValue(preferred, fallback) {
	return isPresent(preferred) ? preferred : fallback;
}

function chooseTimestamp(preferred, fallback) {
	return Number.isFinite(preferred) && preferred !== Number.MAX_SAFE_INTEGER ? preferred : fallback;
}

function shouldPreferNext(current, next) {
	const currentPriority = current?._sourcePriority ?? 0;
	const nextPriority = next?._sourcePriority ?? 0;

	if (nextPriority !== currentPriority) {
		return nextPriority > currentPriority;
	}

	return parseTimestamp(next?._changedDate) >= parseTimestamp(current?._changedDate);
}

function mergeRows(current, next) {
	if (!current) {
		return next;
	}

	if (!next) {
		return current;
	}

	const preferred = shouldPreferNext(current, next) ? next : current;
	const fallback = preferred === next ? current : next;

	return {
		id: chooseValue(preferred.id, fallback.id),
		tournament: chooseValue(preferred.tournament, fallback.tournament),
		playerA: chooseValue(preferred.playerA, fallback.playerA),
		playerB: chooseValue(preferred.playerB, fallback.playerB),
		oddsA: preferred.oddsA ?? fallback.oddsA ?? null,
		oddsB: preferred.oddsB ?? fallback.oddsB ?? null,
		state: chooseValue(preferred.state, fallback.state),
		start: chooseValue(preferred.start, fallback.start),
		score: chooseValue(preferred.score, fallback.score),
		_startTimestamp: chooseTimestamp(preferred._startTimestamp, fallback._startTimestamp),
		_playersKey: chooseValue(preferred._playersKey, fallback._playersKey),
		_changedDate: chooseValue(preferred._changedDate, fallback._changedDate),
		_sourcePriority: Math.max(preferred._sourcePriority ?? 0, fallback._sourcePriority ?? 0)
	};
}

function normalizeCategoryToken(value = '') {
	return String(value).trim().toLowerCase();
}

function isATPFamilyToken(value = '') {
	const token = normalizeCategoryToken(value);

	if (!token) {
		return false;
	}

	return token === 'atp' || token.startsWith('atp_') || token === 'atp qual.' || token === 'atp qual' || token === 'atp qualifiers';
}

function isATPFamilyEvent(item) {
	const eventPath = Array.isArray(item?.event?.path) ? item.event.path : [];

	if (eventPath.length > 0) {
		return eventPath.some(term =>
			isATPFamilyToken(term?.termKey) ||
			isATPFamilyToken(term?.name) ||
			isATPFamilyToken(term?.englishName)
		);
	}

	const itemPath = Array.isArray(item?.path) ? item.path : [];
	return itemPath.some(term =>
		isATPFamilyToken(term?.termKey) ||
		isATPFamilyToken(term?.name) ||
		isATPFamilyToken(term?.englishName)
	);
}

class Module extends Fetcher {
	constructor(options = {}) {
		super(options);
		this.url = options.url ?? ODDSET_ATP_MATCHES_URL;
		this.matchesUrl = options.matchesUrl ?? this.url;
		this.upcomingUrl = options.upcomingUrl ?? ODDSET_TENNIS_MATCHES_URL;
		this.openUrl = options.openUrl ?? ODDSET_LIVE_OPEN_URL;
		this.states = normalizeStates(options.states);
		this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
	}

	getTrackedStates() {
		return new Set(this.states);
	}

	parseMatchesRows(raw) {
		const trackedStates = this.getTrackedStates();

		return (raw?.events || [])
			.filter(item => item.event?.sport === 'TENNIS')
			.filter(item => isATPFamilyEvent(item))
			.filter(item => trackedStates.has(item.event?.state))
			.map(item => toKambiRow(item, ODDS_SOURCE_PRIORITY.MATCHES))
			.filter(Boolean);
	}

	parseOpenRows(raw) {
		const trackedStates = this.getTrackedStates();

		return (raw?.liveEvents || [])
			.filter(item => item.event?.sport === 'TENNIS')
			.filter(item => isATPFamilyEvent(item))
			.filter(item => trackedStates.has(item.event?.state))
			.map(item => toKambiRow(item, ODDS_SOURCE_PRIORITY.OPEN))
			.filter(Boolean);
	}

	parseUpcomingRows(raw) {
		const trackedStates = this.getTrackedStates();

		if (!trackedStates.has('NOT_STARTED')) {
			return [];
		}

		return (raw?.events || [])
			.filter(item => item.event?.sport === 'TENNIS')
			.filter(item => isATPFamilyEvent(item))
			.filter(item => item.event?.state === 'NOT_STARTED')
			.map(item => toKambiRow(item, ODDS_SOURCE_PRIORITY.UPCOMING))
			.filter(Boolean);
	}

	hasMatchesUpcoming(raw) {
		return this.parseMatchesRows(raw).some(row => row.state === 'NOT_STARTED');
	}

	shouldFetchUpcomingFallback(rawMatches) {
		const trackedStates = this.getTrackedStates();

		if (!trackedStates.has('NOT_STARTED')) {
			return false;
		}

		return !this.hasMatchesUpcoming(rawMatches);
	}

	async parseRows(raw) {
		const rowsByPlayers = new Map();
		const matchRows = this.parseMatchesRows(raw?.matches);
		const openRows = this.parseOpenRows(raw?.open);
		const upcomingRows = this.parseUpcomingRows(raw?.upcoming);

		for (const row of [...matchRows, ...openRows, ...upcomingRows]) {
			rowsByPlayers.set(row._playersKey, mergeRows(rowsByPlayers.get(row._playersKey), row));
		}

		const rows = Array.from(rowsByPlayers.values()).map(row => ({
			...row,
			score: row.state === 'STARTED' ? chooseValue(row.score, 'Live') : row.score
		}));

		rows.sort((a, b) => a._startTimestamp - b._startTimestamp);

		return rows;
	}

	async parse(raw) {
		function toOutputRow(row) {
			return {
				id: row.id,
				start: row.start,
				tournament: row.tournament,
				state: row.state,
				score: row.score,
				playerA: {
					name: row.playerA,
					odds: row.oddsA
				},
				playerB: {
					name: row.playerB,
					odds: row.oddsB
				}
			};
		}

		const rows = await this.parseRows(raw);
		return rows.map(toOutputRow);
	}

	async fetchPayload({ url = this.url, requestTimeoutMs = this.requestTimeoutMs, label = 'endpoint' } = {}) {
		function toMessage(error) {
			return error instanceof Error ? error.message : String(error);
		}

		const timeoutMs = Number(requestTimeoutMs);
		const useTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0;
		const controller = useTimeout ? new AbortController() : null;
		const timeout = useTimeout ? setTimeout(() => controller.abort(), timeoutMs) : null;

		try {
			try {
				return await this.fetchURL(url, controller ? { signal: controller.signal } : undefined);
			} catch (error) {
				throw new Error(`Kunde inte na ${label} (${url}): ${toMessage(error)}`);
			}
		} finally {
			if (timeout) {
				clearTimeout(timeout);
			}
		}
	}

	async fetchRows(options = {}) {
		const raw = await this.fetch(options);
		return await this.parseRows(raw);
	}

	async fetchOptionalPayload(shouldFetch, config) {
		if (!shouldFetch) {
			return null;
		}

		try {
			const value = await this.fetchPayload(config);
			return { status: 'fulfilled', value };
		} catch (reason) {
			return { status: 'rejected', reason };
		}
	}

	async fetch(options = {}) {
		function getErrorMessage(result) {
			if (!result || result.status !== 'rejected') {
				return null;
			}

			return result.reason instanceof Error ? result.reason.message : String(result.reason);
		}

		const {
			url,
			matchesUrl,
			upcomingUrl,
			openUrl,
			states,
			requestTimeoutMs
		} = options;

		this.url = url ?? this.url;
		this.matchesUrl = matchesUrl ?? url ?? this.matchesUrl;
		this.upcomingUrl = upcomingUrl ?? this.upcomingUrl;
		this.openUrl = openUrl ?? this.openUrl;
		this.requestTimeoutMs = requestTimeoutMs ?? this.requestTimeoutMs;
		this.states = states != undefined ? normalizeStates(states) : this.states;
		const [matchesResult, openResult] = await Promise.allSettled([
			this.fetchPayload({
				url: this.matchesUrl,
				requestTimeoutMs: this.requestTimeoutMs,
				label: 'Oddset ATP matches-endpoint'
			}),
			this.fetchPayload({
				url: this.openUrl,
				requestTimeoutMs: this.requestTimeoutMs,
				label: 'Oddset live-open-endpoint'
			})
		]);
		const matches = matchesResult.status === 'fulfilled' ? matchesResult.value : null;
		const shouldUseUpcomingFallback = this.shouldFetchUpcomingFallback(matches);
		const upcomingResult = await this.fetchOptionalPayload(shouldUseUpcomingFallback, {
			url: this.upcomingUrl,
			requestTimeoutMs: this.requestTimeoutMs,
			label: 'Oddset tennis upcoming fallback-endpoint'
		});

		const raw = {
			matches,
			open: openResult.status === 'fulfilled' ? openResult.value : null,
			upcoming: upcomingResult?.status === 'fulfilled' ? upcomingResult.value : null,
			meta: {
				requestedStates: this.states,
				hasMatchesUpcoming: this.hasMatchesUpcoming(matches),
				usedUpcomingFallback: shouldUseUpcomingFallback
			},
			errors: {
				matches: getErrorMessage(matchesResult),
				open: getErrorMessage(openResult),
				upcoming: getErrorMessage(upcomingResult)
			}
		};

		if (!raw.matches && !raw.open && !raw.upcoming) {
			const errors = [raw.errors.matches, raw.errors.open, raw.errors.upcoming].filter(Boolean).join(' | ');
			throw new Error(errors || 'Kunde inte na nagon Oddset-kalla');
		}

		return raw;
	}
}

module.exports = Module;
