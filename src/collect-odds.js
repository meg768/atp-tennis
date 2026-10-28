const Oddset = require('./oddset');
const getTaOdds = require('./ta-odds');

function parsePrematchOdds(raw, checkedAt = Date.now()) {
	if (!raw || !Array.isArray(raw.events) || raw.events.some(item => !item?.event || item.event.id == null)) {
		throw new Error('Svenska Spel returned an invalid ATP offering.');
	}

	const rows = [];
	const decimalOdds = value => `${Math.floor(value / 1000)}.${String(value % 1000).padStart(3, '0')}`;

	for (const { event, betOffers } of raw.events) {
		const start = typeof event.start === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/i.test(event.start) ? Date.parse(event.start) : NaN;
		const names = [event.homeName, event.awayName];
		if (event.state !== 'NOT_STARTED' || !Number.isFinite(start) || start <= checkedAt) continue;
		if (!names.every(name => typeof name === 'string' && name.trim()) || names[0] === names[1]) continue;
		if (!Number.isSafeInteger(event.id) || event.id <= 0) throw new Error('Svenska Spel returned an invalid event id.');

		for (const offer of Array.isArray(betOffers) ? betOffers : []) {
			const outcomes = offer.outcomes;
			if (offer.criterion?.englishLabel !== 'Match Odds' || offer.suspended || !Array.isArray(outcomes) || outcomes.length !== 2) continue;
			if (!outcomes.every(outcome => outcome?.status === 'OPEN' && outcome.id != null && Number.isSafeInteger(outcome.odds) && outcome.odds > 0)) continue;
			if (String(outcomes[0].id) === String(outcomes[1].id)) continue;
			const a = outcomes.filter(outcome => outcome.participant === names[0]);
			const b = outcomes.filter(outcome => outcome.participant === names[1]);
			if (a.length !== 1 || b.length !== 1) continue;

			rows.push({
				id: event.id,
				date: new Date(start).toISOString().slice(0, 10),
				tournament: event.group ?? null,
				player: names[0],
				opponent: names[1],
				player_oddset: decimalOdds(a[0].odds),
				opponent_oddset: decimalOdds(b[0].odds),
				player_id: null,
				opponent_id: null,
				player_ta: null,
				opponent_ta: null
			});
			break;
		}
	}

	return rows;
}

class CollectOdds {
	constructor({ mysql, log = console.log, oddset = new Oddset(), fetchImpl = fetch, now = Date.now }) {
		this.mysql = mysql;
		this.log = log;
		this.oddset = oddset;
		this.fetchImpl = fetchImpl;
		this.now = now;
	}

	async run() {
		// Serialize Node collectors across hosts before fetching, not just writing.
		const [lock] = await this.mysql.query("SELECT GET_LOCK(CONCAT(DATABASE(), ':collect-odds'), 0) AS acquired");
		if (lock?.acquired === 0) {
			await this.log('Odds collection skipped: another collector is running.');
			return { skipped: true, updated: 0 };
		}
		if (lock?.acquired !== 1) throw new Error('Could not acquire the odds collection lock.');

		try {
			// Use the same primary ATP feed as the Python collector. The API's
			// merged/cached rows do not retain the open-market validation we need.
			const response = await this.fetchImpl(this.oddset.buildUrl(this.oddset.url), {
				headers: { Accept: 'application/json' },
				signal: AbortSignal.timeout(20000)
			});
			if (!response.ok) throw new Error(`Svenska Spel returned HTTP ${response.status}.`);
			const raw = await response.json();
			const rows = parsePrematchOdds(raw, this.now());

			if (rows.length > 0) {
				await this.mysql.query('START TRANSACTION');
				try {
					for (const row of rows) {
						Object.assign(row, await getTaOdds(this.mysql, row));
						await this.mysql.upsert('odds', row);
					}
					await this.mysql.query('COMMIT');
				} catch (error) {
					await this.mysql.query('ROLLBACK');
					throw error;
				}
			}

			await this.log(`Saved pre-match odds for ${rows.length} of ${raw.events.length} Svenska Spel events.`);
			return { fetched: raw.events.length, updated: rows.length };
		} finally {
			await this.mysql.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':collect-odds')) AS released");
		}
	}
}

module.exports = CollectOdds;
module.exports.parsePrematchOdds = parsePrematchOdds;
