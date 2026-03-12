const Fetcher = require('./fetcher');

const ODDSET_ATP_MATCHES_URL =
	'https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/listView/tennis/atp/all/all/matches.json?channel_id=1&client_id=200&lang=sv_SE&market=SE&useCombined=true&useCombinedLive=true';

const ODDSET_CURRENT_STATES = ['STARTED', 'NOT_STARTED'];
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

class Module extends Fetcher {
	constructor(options = {}) {
		super(options);
		this.url = options.url ?? ODDSET_ATP_MATCHES_URL;
		this.states = options.states ?? ODDSET_CURRENT_STATES;
		this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
	}

	parseRows(payload, { states = this.states } = {}) {
		const STATE_STARTED = 'STARTED';

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

		function toMatchRow(item) {
			const event = item.event || {};
			const offer = getMatchOddsOffer(item);
			const one = offer?.outcomes?.find(outcome => outcome.type === 'OT_ONE');
			const two = offer?.outcomes?.find(outcome => outcome.type === 'OT_TWO');

			return {
				id: event.id ?? `${event.name ?? '-'}-${event.start ?? '-'}`,
				tournament: event.group || '-',
				playerA: event.homeName || '-',
				playerB: event.awayName || '-',
				oddsA: toDecimalOdds(one?.odds),
				oddsB: toDecimalOdds(two?.odds),
				state: event.state || null,
				start: event.start || null,
				liveScore: event.state === STATE_STARTED ? formatLiveScore(item) : null,
				_startTimestamp: parseTimestamp(event.start)
			};
		}

		const trackedStates = new Set(states);
		const rows = (payload?.events || [])
			.filter(item => trackedStates.has(item.event?.state))
			.map(toMatchRow);

		rows.sort((a, b) => a._startTimestamp - b._startTimestamp);

		return rows;
	}

	parse(payload, { states = this.states } = {}) {
		function toOutputRow(row) {
			return {
				start: row.start,
				tournament: row.tournament,
				score: row.liveScore,
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

		const rows = this.parseRows(payload, { states });
		return rows.map(toOutputRow);
	}

	async fetchPayload({ url = this.url, requestTimeoutMs = this.requestTimeoutMs } = {}) {
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
				throw new Error(`Kunde inte na Oddset-endpoint (${url}): ${toMessage(error)}`);
			}
		} finally {
			if (timeout) {
				clearTimeout(timeout);
			}
		}
	}

	async fetchRows({ states = this.states, url = this.url, requestTimeoutMs = this.requestTimeoutMs } = {}) {
		const payload = await this.fetch({ url, requestTimeoutMs });
		return this.parseRows(payload, { states });
	}

	async fetch({ url = this.url, requestTimeoutMs = this.requestTimeoutMs } = {}) {
		return await this.fetchPayload({ url, requestTimeoutMs });
	}
}

module.exports = Module;
