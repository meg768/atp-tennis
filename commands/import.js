let Probe = require('../src/probe.js');
let Command = require('../src/command.js');

const ActivityFetcher = require('../src/fetch-activity');
const ArchiveFetcher = require('../src/fetch-archive');
const PlayerFetcher = require('../src/fetch-player');

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
			describe: 'Run again after specified number of days',
			type: 'number',
			default: 0.33
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

	async discoverEvents({ player, cache = {}, events = {}, activities = {} }) {
		let opponents = [];

		if (cache[player]) {
			return;
		}

		cache[player] = true;

		const playerCount = Object.keys(cache).length;
		await this.log(`Processing player ${player} (${playerCount})...`);

		let activityFetcher = new ActivityFetcher(this.fetcherOptions);
		let activityRaw = await activityFetcher.fetch({ player: player, since: this.argv.since });
		let activity = activityFetcher.parse(activityRaw);

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
				await this.discoverEvents({ player: opponent, cache: cache, events: events, activities: activities });
			}
		}
	}

	async updateELO() {
		let { updateELO } = require('../src/elo.js');
		await updateELO({ mysql: this.mysql });
	}

	async updatePlayerStats() {
		await this.mysql.query(`UPDATE players SET serve_rating = NULL, return_rating = NULL, pressure_rating = NULL`);

		let Fetcher = require('../src/fetch-stats.js');
		let fetcher = new Fetcher(this.fetcherOptions);
		let raw = await fetcher.fetch();
		let details = fetcher.parse(raw);

		for (let entry of details) {
			let sql = ``;
			sql += `UPDATE players SET `;
			sql += `serve_rating = ?, `;
			sql += `return_rating = ?, `;
			sql += `pressure_rating = ? `;
			sql += `WHERE id = ?`;

			let format = [entry.serve, entry.return, entry.pressure, entry.player];

			await this.mysql.query({ sql, format });
		}
	}

	async getTopPlayerRankings(top) {
		let Fetcher = require('../src/fetch-rankings');
		let fetcher = new Fetcher(this.fetcherOptions);
		let raw = await fetcher.fetch({ top: top });
		let rankings = fetcher.parse(raw);

		return rankings;
	}

	async updateRankings(rankings) {
		if (!rankings || !Array.isArray(rankings.players)) {
			return;
		}

		// Keep ranks fetched from each player's profile so imported players
		// outside the requested top list do not lose their current ranking.
		await this.mysql.query(`UPDATE players SET points = NULL`);

		for (let player of rankings.players) {
			await this.mysql.query({
				sql: `UPDATE players SET rank = ?, points = ? WHERE id = ?`,
				format: [player.rank, player.points, player.player]
			});
		}
	}

	async import(rankings) {
		let events = {};
		let activities = {};
		let matches = {};

		await this.log(`Gathering activities from the top ranked ${this.argv.top} players since ${this.argv.since}...`);

		let rankingProbe = new Probe();

		for (let player of rankings.players) {
			await this.discoverEvents({ player: player.player, events: events, activities: activities });
		}

		// Gather up players involved in the matches to update their details later
		let players = {};

		// Save events
		if (true) {
			let probe = new Probe();
			let array = Object.values(events);
			let output = {};

			// Complete matches with duration and scores
			await this.log(`Fetching scores from ${array.length} events...`);

			for (let i = 0; i < array.length; i++) {
				let event = array[i];
				let percent = Math.round((((i + 1) / array.length) * 100) / 1) * 1;

				// Log every 10%
				if (percent % 10 == 0) {
					let message = `${percent}% completed...`;

					if (!output[percent]) {
						await this.log(message);
					}
					output[percent] = message;
				}

				let details = null;

				try {
					let fetcher = new ArchiveFetcher(this.fetcherOptions);
					let raw = await fetcher.fetch({ event: event.id });
					details = fetcher.parse(raw);
				} catch (error) {
					await this.log(`ERROR fetching event ${event.id}: ${error.message}`);
					continue;
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

			await this.log(`Scores fetched in ${probe.toString()}.`);
		}

		// Save events
		if (true) {
			let probe = new Probe();
			let array = Object.values(events);
			let output = {};

			await this.log(`Saving ${array.length} events to database...`);

			for (let i = 0; i < array.length; i++) {
				let event = array[i];
				await this.mysql.upsert('events', event);

				// Calculate percent as integer and round off to nearest 10 for logging purposes
				let percent = Math.round((((i + 1) / array.length) * 100) / 1) * 1;

				// Log every 10%
				if (percent % 10 == 0) {
					let message = `${percent}% completed...`;

					if (!output[percent]) {
						await this.log(message);
					}
					output[percent] = message;
				}
			}

			await this.log(`Events saved. Time taken: ${probe.toString()}.`);
		}

		// Save matches
		if (true) {
			let probe = new Probe();
			let array = Object.values(matches);
			let output = {};

			await this.log(`Saving ${array.length} matches to database...`);

			for (let i = 0; i < array.length; i++) {
				let match = array[i];
				await this.mysql.upsert('matches', match);

				// Calculate percent as integer and round
				let percent = Math.round((((i + 1) / array.length) * 100) / 1) * 1;

				// Log every 10%
				if (percent % 10 == 0) {
					let message = `${percent}% completed...`;

					if (!output[percent]) {
						await this.log(message);
					}
					output[percent] = message;
				}
			}

			await this.log(`Matches saved. Time taken: ${probe.toString()}.`);
		}

		// Update player details, rankings and ELO ratings after the import so they are up to date when viewing the imported matches

		if (true) {
			let probe = new Probe();
			let array = Object.keys(players);
			let output = {};

			await this.log(`Updating player details for ${array.length} players...`);

			for (let i = 0; i < array.length; i++) {
				let player = array[i];
				let percent = Math.round((((i + 1) / array.length) * 100) / 1) * 1;

				// Log every 10%
				if (percent % 10 == 0) {
					let message = `${percent}% completed...`;

					if (!output[percent]) {
						await this.log(message);
					}
					output[percent] = message;
				}

				try {
					let playerFetcher = new PlayerFetcher(this.fetcherOptions);
					let detailsRaw = await playerFetcher.fetch({ player: player });
					let details = playerFetcher.parse(detailsRaw);

					if (!details) {
						continue;
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
			await this.log(`Player details updated. Time taken: ${probe.toString()}.`);
		}
	}

	async run(argv) {
		this.argv = argv;
		let work = async () => {
			try {
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

				let rankings = await this.getTopPlayerRankings(this.argv.top);

				await this.log(`Starting import...`);
				await this.import(rankings);

				await this.log(`Updating rankings...`);
				await this.updateRankings(rankings);
				await this.log(`Rankings updated.`);

				await this.log(`Updating player stats...`);
				await this.updatePlayerStats();
				await this.log(`Player stats updated.`);

				await this.log(`Updating ELO ratings...`);
				await this.updateELO();
				await this.log(`ELO ratings updated.`);

				await this.log(`Running sp_update...`);
				await this.mysql.query(`CALL sp_update()`);

				await this.log(`Import finished in ${probe.toString()}.`);
				this.mysql.disconnect();
			} catch (error) {
				await this.log(`FATAL ERROR: ${error.message}`);
				console.error(error.stack);
			} finally {
			}

			if (argv.loop) {
				let loop = argv.loop;
				await this.log(`Waiting for next run in ${loop} days.`);

				setTimeout(
					() => {
						work();
					},
					loop * 24 * 60 * 60 * 1000
				);
			}
		};

		await work();
	}
}

module.exports = new Import();
