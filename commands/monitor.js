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

    // Determine if the match is finished based on the event data
    // Examine score, which is a string like "6-3 4-6 7-6(5)". 
    // If the last set has a valid score and there are 2 or 3 sets, we can consider the match finished.
	isMatchFinished(score) {
		if (!score || typeof score !== 'string') {
			return false;
		}

        // Split into sets and trim whitespace
		const sets = score.split(' ').map(s => s.trim());
		const lastSet = sets[sets.length - 1];

		// A simple regex to check if the set score is in the format of "6-3" or "7-6(5)"
		const setScoreRegex = /^\d+-\d+(\(\d+\))?$/;
		if (!setScoreRegex.test(lastSet)) {
			return false;
		}

		// If we have 2 or 3 sets, and the last set is valid, consider the match finished
		return sets.length >= 2 && sets.length <= 3;
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
                //events = events.filter(event => !this.isMatchFinished(event.score));

             
				for (let event of events) {
					if (this.isMatchFinished(event)) {
						continue;
					}
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
