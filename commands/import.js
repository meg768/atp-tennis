let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');

const ActivityFetcher = require('../src/fetch-activity');
const RankingsFetcher = require('../src/fetch-rankings');
const EventFetcher = require('../src/fetch-event');
const PlayerFetcher = require('../src/fetch-player');

class Import extends Command {
	constructor() {
		super({ command: 'import [options]', description: 'Import matches' });
		this.mysql = new MySQL();
	}

	arguments(args) {
		let year = new Date().getFullYear();

		args.option('loop', {
			alias: 'l',
			describe: 'Run again after specified number of days',
			type: 'number',
			default: 1
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

	async importPlayer({ player, players = {}, events = {}, matches = {} }) {
		let opponents = [];

		if (players[player]) {
			return;
		}

		players[player] = true;

		if (true) {
			if (player == 'M0NI' || player == 'EA24') {
				console.log(player);
			}
			let activityFetcher = new ActivityFetcher();
			let activity = await activityFetcher.fetch({ player: player, since: this.argv.since });


			for (let event of activity.events) {
				// Skip Challenger and FU and change type to readable
				switch (event.type) {
					case 'FU': {
						return;
					}
					case 'CH': {
						return;
					}
					case 'GS': {
						event.type = 'Grand Slam';
						break;
					}
					case 'OL': {
						event.type = 'Olympics';
						break;
					}
					case '1000': {
						event.type = 'Masters';
						break;
					}
					case '500': {
						event.type = 'ATP-500';
						break;
					}
					case '250': {
						event.type = 'ATP-250';
						break;
					}
					case 'LVR': {
						event.type = 'Rod Laver Cup';
						break;
					}
					case 'DC': {
						event.type = 'Davis Cup';
						break;
					}
					case 'UC': {
						event.type = 'United Cup';
						break;
					}
				}

				events[event.event] = {
					id: event.event,
					date: event.date,
					name: event.name,
					location: event.location,
					type: event.type,
					surface: event.surface,
					url: event.url
				};

				if (event.event == '2025-404') {
					console.log(event.matches.length);
				}

				for (let match of event.matches) {

					if (match.match == '2025-404-M0NI-EA24') {
						console.log(match);
					}
					matches[match.match] = {
						id: match.match,
						event: event.event,
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
			}
		}
		if (opponents.length > 0) {
			for (let opponent of opponents) {
				await this.importPlayer({ player: opponent, players: players, events: events, matches: matches });
			}
		}
	}

	async import() {
		let rankingsFetcher = new RankingsFetcher();
		let rankings = await rankingsFetcher.fetch({ top: this.argv.top });

		let events = {};
		let players = {};
		let matches = {};

		for (let player of rankings.players) {
			await this.importPlayer({ player: player.player, players: players, events: events, matches: matches });
		}

		// Complement matches with duraction and scores
		if (true) {
			await this.log(`Gathering event information...`);

			for (let [eventID, event] of Object.entries(events)) {
				let eventFetcher = new EventFetcher();
				let details = null;

				try {
					details = await eventFetcher.fetch({ event: eventID });
				} catch (error) {
					await this.log(`${error.message}`);
					continue;
				}

				if (details && details.matches) {
					for (let match of details.matches) {
						// Update match data
						let entry = matches[match.match] || {};

						if (match.match == '2025-404-M0NI-EA24') {
							console.log(entry);
							throw new Error('STOP');
						}
						entry.id = match.match;
						entry.event = eventID;
						entry.round = match.round;
						entry.winner = match.winner.player;
						entry.loser = match.loser.player;
						entry.score = match.score;
						entry.duration = match.duration;

						matches[match.match] = entry;

						// Make sure the winner and loser are updated
						players[match.winner.player] = match.winner.player;
						players[match.loser.player] = match.loser.player;
					}
				}
			}
		}

		if (true) {
			await this.log(`Generating events...`);

			for (let [eventID, event] of Object.entries(events)) {
				await this.mysql.upsert('events', event);
			}
		}

		if (true) {
			await this.log(`Generating matches...`);

			for (let [matchID, match] of Object.entries(matches)) {
				await this.mysql.upsert('matches', match);
			}
		}

		// Get details about all involved players
		if (true) {
			players = Object.keys(players);
			players.sort();

			await this.log(`Generating players...`);

			for (let player of players) {

				try {
					let playerFetcher = new PlayerFetcher();
					let details = await playerFetcher.fetch({ player: player });

					await this.mysql.upsert('players', {
						id: details.player,
						name: details.name,
						country: details.country,
						age: details.age,
						pro: details.pro,
						active: details.active,
						height: details.height,
						weight: details.weight,

						career_titles: details.titles.career,
						ytd_titles: details.titles.ytd,

						career_wins: details.matches.career.wins,
						career_losses: details.matches.career.losses,

						ytd_wins: details.matches.ytd.wins,
						ytd_losses: details.matches.ytd.losses,

						url: details.url,
						rank: details.ranking.current.rank,
						highest_rank: details.ranking.highest.rank,
						highest_rank_date: details.ranking.highest.rank ? details.ranking.highest.date : null
					});
				} catch (error) {
					await this.log(error.message);
				}
			}
		}
	}

	async run(argv) {
		this.argv = argv;
		let work = async () => {
			try {
				this.mysql.connect();
				let probe = new Probe();

				if (argv.clean) {
					await this.mysql.query('TRUNCATE TABLE events');
					await this.mysql.query('TRUNCATE TABLE players');
					await this.mysql.query('TRUNCATE TABLE matches');
				}

				await this.log(`Starting import...`);
				await this.import();
				await this.log(`Import finished in ${probe.toString()}.`);
			} catch (error) {
				await this.log(error.message);
				console.error(error.stack);
			} finally {
				this.mysql.disconnect();
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
