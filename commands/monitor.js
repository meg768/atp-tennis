let Command = require('../src/command.js');
let LiveFetcher = require('../src/fetch-live.js');
let mysql = require('../src/mysql.js');

class Module extends Command {
	constructor() {
		super({ command: 'monitor [options]', description: 'Log ongoing ATP live singles matches' });

		this.cache = Object.create(null);
	}

	getCache(name) {
		if (!this.cache[name]) {
			this.cache[name] = new Map();
		}
		return this.cache[name];
	}

	arguments(args) {
		args.option('interval', {
			alias: 'i',
			describe: 'Polling interval in seconds',
			type: 'number',
			default: 30
		});

		args.help();
	}

	sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}


	// Update the event object with player ranks from the database
	async updateEventWithRank(event) {
		const cache = this.getCache('playerRanks');

		async function getPlayerRank(id) {
			if (!id) {
				return null;
			}

			if (cache.has(id)) {
				return cache.get(id);
			}

			const rows = await mysql.query({
				sql: 'SELECT `rank` FROM players WHERE id = ? LIMIT 1',
				format: [id]
			});

			const rawRank = rows.length > 0 ? rows[0].rank : null;
			const rank = Number.isInteger(Number(rawRank)) ? Number(rawRank) : null;
			cache.set(id, rank);
			return rank;
		}

		if (event?.player?.id) {
			event.player.rank = await getPlayerRank(event.player.id);
		}
		if (event?.opponent?.id) {
			event.opponent.rank = await getPlayerRank(event.opponent.id);
		}
	}

	async updateEventWithWinsAndLosses(event) {
		const cache = this.getCache('playerMatchups');

		// Returns an object with wins and losses.
		// wins - playerA wins against playerB
		// losses - playerA loses against playerB
		async function getMatchWinsAndLosses(playerA, playerB) {
			if (!playerA || !playerB) {
				return { wins: 0, losses: 0 };
			}

			const key = `${playerA}|${playerB}`;

			if (cache.has(key)) {
				return cache.get(key);
			}

			const rows = await mysql.query({
				sql: `
					SELECT
						SUM(CASE WHEN winner = ? AND loser = ? THEN 1 ELSE 0 END) AS wins,
						SUM(CASE WHEN winner = ? AND loser = ? THEN 1 ELSE 0 END) AS losses
                        FROM matches
                        WHERE (winner = ? AND loser = ?)
                        OR (winner = ? AND loser = ?)
			`,
				format: [playerA, playerB, playerB, playerA, playerA, playerB, playerB, playerA]
			});

			const row = rows[0] || {};
			const result = {
				wins: Number.isInteger(Number(row.wins)) ? Number(row.wins) : 0,
				losses: Number.isInteger(Number(row.losses)) ? Number(row.losses) : 0
			};

			cache.set(key, result);

			return result;
		}

		if (event?.player?.id && event?.opponent?.id) {
			const { wins, losses } = await getMatchWinsAndLosses(event.player.id, event.opponent.id);
			event.player.wins = wins;
			event.player.losses = losses;
			event.opponent.wins = losses;
			event.opponent.losses = wins;
		}
	}

	async run(argv) {
		this.argv = argv;

		const liveFetcher = new LiveFetcher({});
		await mysql.connect();

		try {
			while (true) {
				let events = await liveFetcher.fetch();
                

                events = events.filter((event) => {
                    return !event.winner;
                });

                
				for (let event of events) {
					await this.updateEventWithRank(event);
					await this.updateEventWithWinsAndLosses(event);
				}

				console.log(JSON.stringify(events, null, 2));
				await this.sleep(this.argv.interval * 1000);
			}
		} finally {
			if (mysql.connection) {
				await mysql.disconnect();
			}
		}
	}
}

module.exports = new Module();
