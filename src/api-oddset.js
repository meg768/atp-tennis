const Api = require('./api');
const Oddset = require('./oddset.js');
const searchPlayersBulk = require('./search-players-bulk.js');

class ApiOddset extends Api {
	constructor(options = {}) {
		super(options);
		this.url = options.url ?? null;
	}

	usesRawResponse(options = null) {
		options = this.resolveOptions(options);
		return options.raw != undefined && (options.raw === '' || options.raw != 0);
	}

	async attachPlayerIds(rows = []) {
		if (!this.mysql || rows.length === 0) {
			return rows.map(row => ({
				...row,
				playerA: {
					...(row.playerA || {}),
					id: null
				},
				playerB: {
					...(row.playerB || {}),
					id: null
				}
			}));
		}

		const uniqueNames = [...new Set(
			rows
				.flatMap(row => [row?.playerA?.name, row?.playerB?.name].map(name => String(name || '').trim()))
				.filter(Boolean)
		)];
		const playersByName = await searchPlayersBulk(this.mysql, uniqueNames);

		return rows.map(row => ({
			...row,
			playerA: {
				...(row.playerA || {}),
				id: playersByName[String(row?.playerA?.name || '').trim()]?.id ?? null
			},
			playerB: {
				...(row.playerB || {}),
				id: playersByName[String(row?.playerB?.name || '').trim()]?.id ?? null
			}
		}));
	}

	async fetch(options = null) {
		options = this.resolveOptions(options);

		const oddset = new Oddset({
			url: options.url ?? options.matchesUrl ?? this.url ?? undefined,
			openUrl: options.openUrl ?? undefined,
			upcomingUrl: options.upcomingUrl ?? undefined
		});

		if (this.usesRawResponse(options)) {
			return await oddset.fetch();
		}

		return await oddset.getMatches();
	}

	async parse(raw) {
		if (this.usesRawResponse()) {
			return raw;
		}

		const rows = await this.attachPlayerIds(raw);

		return rows.map(row => ({
			id: row.id,
			start: row.start,
			tournament: row.tournament,
			state: row.state,
			score: row.score,
			serve: row.serve,
			playerA: row.playerA,
			playerB: row.playerB
		}));
	}
}

module.exports = ApiOddset;
