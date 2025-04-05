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
		args.option('loop', {
			alias: 'l',
			describe: 'Run again after specified number of days',
			type: 'number',
			default: undefined
		});

		args.option('clean', {
			alias: 'c',
			describe: 'Remove previous imports',
			type: 'boolean',
			default: true
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

	async importPlayerActivity({ player, players, events, matches }) {
		let opponents = [];

		if (players[player]) {
			return;
		}

		// Important - this deletes all variables before recursion
		if (true) {
			let playerFetcher = new PlayerFetcher();

			if (true) {
				let info = await playerFetcher.fetch({ player: player });

				await this.mysql.upsert('players', {
					id: player,
					name: info.name,
					country: info.country,
					age: info.age,
					height: info.height,
					weight: info.weight,

					ct: info.titles.career,
					ytdt: info.titles.ytd,

					cw: info.matches.career.wins,
					cl: info.matches.career.losses,

					ytdw: info.matches.ytd.wins,
					ytdl: info.matches.ytd.losses,

					url: info.url,
					crk: info.ranking.current.rank,
					hrk: info.ranking.highest.rank,
					hrkd: info.ranking.highest.rank ? info.ranking.highest.date : null
				});
			}

			let activityFetcher = new ActivityFetcher();
			let activity = await activityFetcher.fetch({ player: player, since: 2020 });

			if (!activity || !activity.events) {
				return;
			}

			players[player] = player;

			for (let event of activity.events) {
				if (events[event.event]) {
					continue;
				}

				switch (event.type) {
					case 'FU':
						return;
					case 'CH':
						return;
				}

				events[event.event] = event;

				await this.mysql.upsert('events', {
					id: event.event,
					name: event.name,
					location: event.location,
					type: event.type,
					surface: event.surface,
					date: event.date,
					url: event.url
				});

				for (let match of event.matches) {
					if (matches[match.match]) {
						continue;
					}
					matches[match.match] = match;

					await this.mysql.upsert('matches', {
						id: match.match,
						event: event.event,
						round: match.round,
						winner: match.winner.player,
						loser: match.loser.player,
						lrk: match.loser.rank,
						wrk: match.winner.rank
					});

					if (match.opponent && !opponents.includes(match.opponent)) {
						opponents.push(match.opponent);
					}
				}
			}
		}
		if (opponents.length > 0) {
			for (let opponent of opponents) {
				await this.importPlayerActivity({ player: opponent, players: players, events: events, matches: matches });
			}
		}
	}

	async import() {
		let rankingsFetcher = new RankingsFetcher();
		let activityFetcher = new ActivityFetcher();
		let eventFetcher = new EventFetcher();

		let rankings = await rankingsFetcher.fetch({ top: 100 });

		let players = {};
		let events = {};
		let matches = {};

		for (let player of rankings.players) {
			await this.importPlayerActivity({ player: player.player, players: players, events: events, matches: matches });
		}
	}

	async run(argv) {
		this.argv = argv;
		let work = async () => {
			try {
				this.mysql.connect();
				let probe = new Probe();

				await this.log(`Starting import...`);

				if (argv.clean) {
					await this.mysql.query('TRUNCATE TABLE events');
					await this.mysql.query('TRUNCATE TABLE players');
					await this.mysql.query('TRUNCATE TABLE matches');
					await this.log('Cleaned events table.');
				}

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
