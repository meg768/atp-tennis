let Probe = require('../src/probe.js');
let Command = require('../src/command.js');

const ActivityFetcher = require('../src/fetch-activity');
const ArchiveFetcher = require('../src/fetch-archive');
const PlayerFetcher = require('../src/fetch-player');
const UpdateELO = require('../src/update-elo');
const UpdatePlayerStats = require('../src/update-player-stats');
const UpdateRankings = require('../src/update-rankings');
const UpdateSurfaceFactors = require('../src/update-surface-factors');

require('../src/logger')(); // 1 MB

class Import extends Command {
	constructor() {
		super({ command: 'import [options]', description: 'Import matches' });
		this.mysql = require('../src/mysql.js');
		this.fetcherOptions = { delay: 500 };
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

	getProgressInterval(total) {
		if (!Number.isFinite(total) || total <= 0) {
			return null;
		}

		return Math.max(1, Math.floor(total / 10));
	}

	async logProgress(index, total) {
		let interval = this.getProgressInterval(total);

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

	async processItems({
		items = [],
		startMessage,
		finishMessage,
		progressPosition = 'after',
		onItem
	}) {
		let probe = new Probe();

		if (startMessage) {
			await this.log(startMessage);
		}

		for (let i = 0; i < items.length; i++) {
			let item = items[i];

			if (progressPosition === 'before') {
				await this.logProgress(i, items.length);
			}

			await onItem(item, i);

			if (progressPosition !== 'before') {
				await this.logProgress(i, items.length);
			}
		}

		if (typeof finishMessage === 'function') {
			await this.log(finishMessage(probe));
		} else if (finishMessage) {
			await this.log(finishMessage);
		}
	}

	async discoverEvents({ player, cache = {}, events = {}, activities = {} }) {
		let discover = async player => {
			player = String(player).toUpperCase();

			let opponents = [];

			if (cache[player]) {
				return;
			}

			cache[player] = true;

			let activity = null;

			try {
				let activityFetcher = new ActivityFetcher(this.fetcherOptions);
				let activityRaw = await activityFetcher.fetch({ player: player, since: this.argv.since });
				activity = activityFetcher.parse(activityRaw);
			} catch (error) {
				await this.log(`ERROR fetching activity for player ${player}: ${error.message}`);
				return;
			}

			if (!activity || !activity.events) {
				await this.log(`No activity found for player ${player}, skipping.`);
				return;
			}

			for (let event of activity.events) {
				// Strip matches from event data, they will be completed later with details from the archive fetcher
				let { matches, ...entry } = event;

				entry = { ...(events[entry.id] || {}), ...entry };

				// Add activities with the details we have so far
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

			if (opponents.length > 0) {
				for (let opponent of opponents) {
					await discover(opponent);
				}
			}
		};

		await discover(player);
	}

	async getTopPlayers(top) {
		let Fetcher = require('../src/fetch-top-players');
		let fetcher = new Fetcher(this.fetcherOptions);
		let raw = await fetcher.fetch({ top: top });
		let players = fetcher.parse(raw);

		return players;
	}

	async fetchScores(events, activities) {
		let matches = {};
		let players = {};
		let array = Object.values(events);

		await this.processItems({
			items: array,
			startMessage: `Fetching scores from ${array.length} events...`,
			finishMessage: probe => `Scores fetched in ${probe.toString()}.`,
			progressPosition: 'before',
			onItem: async event => {
				let details = null;

				try {
					let fetcher = new ArchiveFetcher(this.fetcherOptions);
					let raw = await fetcher.fetch({ event: event.id });
					details = fetcher.parse(raw);
				} catch (error) {
					await this.log(`ERROR fetching event ${event.id}: ${error.message}`);
					return;
				}

				if (details?.matches) {
					for (let match of details.matches) {
						let entry = {};

						entry.id = match.id;
						entry.event = event.id;
						entry.round = match.round;
						entry.winner = match.winner.player;
						entry.loser = match.loser.player;
						entry.score = match.score;
						entry.status = match.status;
						entry.duration = match.duration;

						// Check if we already have some details about this match from the activity fetcher and complement it with the new details
						let complement = activities[match.id];

						if (complement) {
							entry = { ...complement, ...entry };
						}

						matches[match.id] = entry;

						players[match.winner.player] = match.winner.player;
						players[match.loser.player] = match.loser.player;
					}
				}
			}
		});

		return { matches, players };
	}

	async saveRows(table, rows, label) {
		await this.processItems({
			items: rows,
			startMessage: `Saving ${rows.length} ${label} to database...`,
			finishMessage: probe => `${label[0].toUpperCase()}${label.slice(1)} saved. Time taken: ${probe.toString()}.`,
			onItem: async row => {
				await this.mysql.upsert(table, row);
			}
		});
	}

	async updatePlayerDetails(players) {
		let array = Object.keys(players);

		await this.processItems({
			items: array,
			startMessage: `Updating player details for ${array.length} players...`,
			finishMessage: probe => `Player details updated. Time taken: ${probe.toString()}.`,
			onItem: async player => {
				try {
					let playerFetcher = new PlayerFetcher(this.fetcherOptions);
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

	async import(rankings) {
		let events = {};
		let activities = {};
		let probe = new Probe();
		let cache = {};

		await this.log(`Gathering activities from the top ranked ${this.argv.top} players since ${this.argv.since}...`);

		for (let player of rankings.players) {
			await this.discoverEvents({ player: player.player, cache: cache, events: events, activities: activities });
		}

		await this.log(
			`Activities gathered in ${probe.toString()}. Players processed: ${Object.keys(cache).length}. Events discovered: ${Object.keys(events).length}. Matches discovered: ${Object.keys(activities).length}.`
		);

		let { matches, players } = await this.fetchScores(events, activities);

		await this.saveRows('events', Object.values(events), 'events');
		await this.saveRows('matches', Object.values(matches), 'matches');

		// Update player details, rankings and ELO ratings after the import so they are up to date when viewing the imported matches
		await this.updatePlayerDetails(players);
	}

	async run(argv) {
		this.argv = argv;
		let work = async () => {
			try {
				if (argv.light) {
					let year = new Date().getFullYear();
					this.argv.since = year;
					this.argv.top = 1;
					await this.log(`Light mode enabled: importing current year ${year} using top 1 player.`);
				}

				await this.mysql.connect();
				let probe = new Probe();

				if (argv.clean) {
					await this.log(`Cleaning previous import...`);
					await this.mysql.query('TRUNCATE TABLE log');
					await this.mysql.query('TRUNCATE TABLE events');
					await this.mysql.query('TRUNCATE TABLE players');
					await this.mysql.query('TRUNCATE TABLE matches');
					await this.log(`Tables truncated.`);
				}

					let rankings = await this.getTopPlayers(this.argv.top);

				if (!rankings || !Array.isArray(rankings.players) || rankings.players.length === 0) {
					throw new Error(`No rankings returned for top ${this.argv.top}. Import aborted.`);
				}

				await this.log(`Starting import...`);
				await this.import(rankings);

					let log = this.log.bind(this);
					let updateRankings = new UpdateRankings({ mysql: this.mysql, log: log });
					await updateRankings.run(rankings);

					let updatePlayerStats = new UpdatePlayerStats({ mysql: this.mysql, log: log, fetcherOptions: this.fetcherOptions });
					await updatePlayerStats.run();

					let updateELO = new UpdateELO({ mysql: this.mysql, log: log });
					await updateELO.run();

					let updateSurfaceFactors = new UpdateSurfaceFactors({ mysql: this.mysql, log: log });
					await updateSurfaceFactors.run();

					await this.log(`Import finished in ${probe.toString()}.`);
			} catch (error) {
				await this.log(`FATAL ERROR: ${error.message}`);
				console.error(error.stack);
			} finally {
				await this.mysql.disconnect();
			}

			if (argv.loop) {
				let loop = argv.loop;
				await this.log(`Waiting for next run in ${loop} hours.`);

				setTimeout(
					() => {
						work();
					},
					loop * 60 * 60 * 1000
				);
			}
		};

		await work();
	}
}

module.exports = new Import();
