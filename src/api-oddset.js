const Api = require('./api');
const Oddset = require('./oddset.js');
const searchPlayers = require('./search-players.js');

class ApiOddset extends Api {
	constructor(options = {}) {
		super(options);
		this.url = options.url ?? null;
	}

	usesRawResponse(options = null) {
		options = this.resolveOptions(options);
		return options.raw != undefined && (options.raw === '' || options.raw != 0);
	}

	async resolvePlayerId(name) {
		if (!this.mysql) {
			return null;
		}

		const rows = await searchPlayers(this.mysql, name, 5);
		return rows[0]?.id ?? null;
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
		const idEntries = await Promise.all(
			uniqueNames.map(async name => [name, await this.resolvePlayerId(name)])
		);
		const playerIdByName = Object.fromEntries(idEntries);

		return rows.map(row => ({
			...row,
			playerA: {
				...(row.playerA || {}),
				id: playerIdByName[String(row?.playerA?.name || '').trim()] ?? null
			},
			playerB: {
				...(row.playerB || {}),
				id: playerIdByName[String(row?.playerB?.name || '').trim()] ?? null
			}
		}));
	}

	async fetch(options = null) {
		options = this.resolveOptions(options);

		const oddset = new Oddset({
			url: options.url ?? this.url ?? undefined
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
