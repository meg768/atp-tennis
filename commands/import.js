let Probe = require('../src/probe.js');
let Command = require('../src/command.js');

const UpdateELO = require('../src/update-elo');
const UpdatePlayerStats = require('../src/update-player-stats');
const UpdateRankings = require('../src/update-rankings');
const UpdateSurfaceFactors = require('../src/update-surface-factors');

require('../src/logger')(); // 1 MB

class Import extends Command {
	constructor() {
		super({ command: 'import [options]', description: 'Import matches' });
		this.mysql = require('../src/mysql.js');
		this.fetchOptions = { delay: 500 };
	}

	arguments(args) {
		let year = new Date().getFullYear();

		args.option('loop', {
			alias: 'l',
			describe: 'Run again after specified number of hours',
			type: 'number',
			default: 12
		});

		args.option('since', {
			alias: 's',
			describe: 'Import matches since this year',
			type: 'number',
			default: year
		});

		args.option('top', {
			alias: 't',
			describe: 'Import from top X players',
			type: 'number',
			default: 100
		});

		args.option('clean', {
			alias: 'c',
			describe: 'Remove previous imports',
			type: 'boolean',
			default: false
		});

		args.option('light', {
			describe: 'Run a minimal import using the current year and top 1 player',
			type: 'boolean',
			default: false
		});
		args.help();
	}

	async log(message) {
		try {
			await this.mysql.upsert('log', { message: message });
		} catch (error) {
		} finally {
			console.log(message);
		}
	}

	async delay(hours) {
		return await new Promise(resolve => setTimeout(resolve, hours * 60 * 60 * 1000));
	}

	async process({ items = [], message, fn }) {
		function getInterval(total) {
			if (!Number.isFinite(total) || total <= 0) {
				return null;
			}

			return Math.max(1, Math.floor(total / 10));
		}

		async function logProgress(index, total) {
			let interval = getInterval(total);

			if (!interval) {
				return;
			}

			let completed = index + 1;

			if (completed % interval !== 0 && completed !== total) {
				return;
			}

			let percent = Math.round((completed / total) * 100);
			await this.log(`${percent}% completed...`);
		}

		let probe = new Probe();

		if (message) {
			await this.log(message);
		}

		for (let i = 0; i < items.length; i++) {
			await logProgress.call(this, i, items.length);
			await fn(items[i], i);
		}

		await this.log(`Completed in ${probe.toString()}.`);
	}

	async updatePlayerDetails({ players }) {
		let Fetcher = require('../src/fetch-player');
		let ids = Object.keys(players);

		await this.process({
			items: ids,
			message: `Updating player details for ${ids.length} players...`,
			fn: async player => {
				try {
					let playerFetcher = new Fetcher(this.fetchOptions);
					let detailsRaw = await playerFetcher.fetch({ player: player });
					let details = playerFetcher.parse(detailsRaw);

					if (!details) {
						return;
					}

					await this.mysql.upsert('players', {
						id: details.player,
						name: details.name,
						country: details.country,
						age: details.age,
						pro: details.pro,
						birthdate: details.birthdate,
						active: details.active,
						height: details.height,
						weight: details.weight,
						career_titles: details.titles.career,
						ytd_titles: details.titles.ytd,
						career_wins: details.matches.career.wins,
						career_losses: details.matches.career.losses,
						ytd_wins: details.matches.ytd.wins,
						ytd_losses: details.matches.ytd.losses,
						ytd_prize: details.prize.ytd,
						career_prize: details.prize.career,
						url: details.url,
						rank: details.ranking.current.rank,
						highest_rank: details.ranking.highest.rank,
						highest_rank_date: details.ranking.highest.rank ? details.ranking.highest.date : null
					});
				} catch (error) {
					await this.log(`ERROR updating player ${player}: ${error.message}`);
				}
			}
		});
	}

	async discover({ player, cache = {}, events = {}, activities = {}, since }) {
		let Fetcher = require('../src/fetch-activity');
		let visit = async player => {
			player = String(player).toUpperCase();

			if (cache[player]) {
				return;
			}

			cache[player] = true;

			let activity = null;

			try {
				let activityFetcher = new Fetcher(this.fetchOptions);
				let activityRaw = await activityFetcher.fetch({ player: player, since: since });
				activity = activityFetcher.parse(activityRaw);
			} catch (error) {
				await this.log(`ERROR fetching activity for player ${player}: ${error.message}`);
				return;
			}

			if (!activity || !activity.events) {
				await this.log(`No activity found for player ${player}, skipping.`);
				return;
			}

			let opponents = [];

			for (let event of activity.events) {
				let { matches, ...entry } = event;
				entry = { ...(events[entry.id] || {}), ...entry };

				for (let match of matches) {
					activities[match.id] = {
						id: match.id,
						event: entry.id,
						round: match.round,
						winner: match.winner.player,
						winner_rank: match.winner.rank ? match.winner.rank : null,
						loser: match.loser.player,
						loser_rank: match.loser.rank ? match.loser.rank : null
					};

					if (match.opponent && !opponents.includes(match.opponent)) {
						opponents.push(match.opponent);
					}
				}

				events[entry.id] = entry;
			}

			for (let opponent of opponents) {
				await visit(opponent);
			}
		};

		await visit(player);
	}

	async getPlayers({ top }) {
		let Fetcher = require('../src/fetch-top-players');
		let fetcher = new Fetcher(this.fetchOptions);
		let raw = await fetcher.fetch({ top: top });
		return fetcher.parse(raw);
	}

	async fetchArchive({ events, activities }) {
		let Fetcher = require('../src/fetch-archive');
		let matches = {};
		let players = {};
		let array = Object.values(events);

		await this.process({
			items: array,
			message: `Fetching scores from ${array.length} events...`,
			fn: async event => {
				let details = null;

				try {
					let fetcher = new Fetcher(this.fetchOptions);
					let raw = await fetcher.fetch({ event: event.id });
					details = fetcher.parse(raw);
				} catch (error) {
					await this.log(`ERROR fetching event ${event.id}: ${error.message}`);
					return;
				}

				if (!details?.matches) {
					return;
				}

				for (let match of details.matches) {
					let entry = {
						id: match.id,
						event: event.id,
						round: match.round,
						winner: match.winner.player,
						loser: match.loser.player,
						score: match.score,
						status: match.status,
						duration: match.duration
					};

					if (activities[match.id]) {
						entry = { ...activities[match.id], ...entry };
					}

					matches[match.id] = entry;
					players[match.winner.player] = match.winner.player;
					players[match.loser.player] = match.loser.player;
				}
			}
		});

		return { matches, players };
	}

	async upsert({ table, rows, label }) {
		await this.process({
			items: rows,
			message: `Saving ${rows.length} ${label} to database...`,
			fn: async row => {
				await this.mysql.upsert(table, row);
			}
		});
	}

	async run(argv) {
		let mysql = this.mysql;

		let work = async () => {
			try {
				if (argv.light) {
					let year = new Date().getFullYear();
					argv.since = year;
					argv.top = 1;
					await this.log(`Light mode enabled: importing current year ${year} using top 1 player.`);
				}

				await mysql.connect();
				let probe = new Probe();

				if (argv.clean) {
					await this.log(`Cleaning previous import...`);
					await mysql.query('TRUNCATE TABLE log');
					await mysql.query('TRUNCATE TABLE events');
					await mysql.query('TRUNCATE TABLE players');
					await mysql.query('TRUNCATE TABLE matches');
					await this.log(`Tables truncated.`);
				}

				let players = await this.getPlayers({ top: argv.top });
				let events = {};
				let activities = {};
				let cache = {};

				if (!players || !Array.isArray(players.players) || players.players.length === 0) {
					throw new Error(`No rankings returned for top ${argv.top}. Import aborted.`);
				}

				await this.log(`Starting import...`);

				if (true) {
					let probe = new Probe();
					await this.log(`Gathering activities from the top ranked ${argv.top} players since ${argv.since}...`);
					for (let player of players.players) {
						await this.discover({ player: player.player, cache: cache, events: events, activities: activities, since: argv.since });
					}
					await this.log(
						`Activities gathered in ${probe.toString()}. Players processed: ${Object.keys(cache).length}. Events discovered: ${Object.keys(events).length}. Matches discovered: ${Object.keys(activities).length}.`
					);
				}

				let { matches, players: details } = await this.fetchArchive({ events, activities });
				await this.upsert({ table: 'events', rows: Object.values(events), label: 'events' });
				await this.upsert({ table: 'matches', rows: Object.values(matches), label: 'matches' });
				await this.updatePlayerDetails({ players: details });

				let updateRankings = new UpdateRankings({ mysql, log: this.log.bind(this) });
				await updateRankings.run(players);

				let updatePlayerStats = new UpdatePlayerStats({ mysql, log: this.log.bind(this), fetchOptions: this.fetchOptions });
				await updatePlayerStats.run();

				let updateELO = new UpdateELO({ mysql, log: this.log.bind(this) });
				await updateELO.run();

				let updateSurfaceFactors = new UpdateSurfaceFactors({ mysql, log: this.log.bind(this) });
				await updateSurfaceFactors.run();

				await this.log(`Import finished in ${probe.toString()}.`);
			} catch (error) {
				await this.log(`FATAL ERROR: ${error.message}`);
				console.error(error.stack);
			} finally {
				await mysql.disconnect();
			}

			if (argv.loop) {
				await this.log(`Waiting for next run in ${argv.loop} hours.`);
				await this.delay(argv.loop);
				await work();
			}
		};

		await work();
	}
}

module.exports = new Import();
