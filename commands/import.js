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
			default: undefined
		});

		args.option('since', {
			alias: 's',
			describe: 'Import matches since this year',
			type: 'number',
			default: year - 10
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

	async importPlayer({ player, players = {}, events = {}, matches = {} }) {
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
					rank: info.ranking.current.rank,
					hrk: info.ranking.highest.rank,
					hrkd: info.ranking.highest.rank ? info.ranking.highest.date : null
				});
			}

			let activityFetcher = new ActivityFetcher();
			let activity = await activityFetcher.fetch({ player: player, since: this.argv.since });

			if (!activity || !activity.events) {
				return;
			}

			players[player] = player;

			for (let event of activity.events) {
				if (events[event.event]) {
					continue;
				}

				// Skip Challenger and FU
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
				await this.importPlayer({ player: opponent, players: players, events: events, matches: matches });
			}
		}
	}

	async import() {
		let rankingsFetcher = new RankingsFetcher();
		let activityFetcher = new ActivityFetcher();
		let eventFetcher = new EventFetcher();

		let rankings = await rankingsFetcher.fetch({ top: this.argv.top });

		let events = {};
		for (let player of rankings.players) {
			await this.importPlayer({ player: player.player, events: events });
		}

		// Convert map to array of events ID:s
		events = Object.keys(events);

		for (let event of events) {
			let eventFetcher = new EventFetcher();
			let details = await eventFetcher.fetch({ event: event });

			if (!details) {
				continue;
			}

			if (details.matches) {
				for (let match of details.matches) {
					let sql = ``;
					sql += `UPDATE matches SET `;
					sql += `round = ?, score = ?, duration = ? `;
					sql += `WHERE id = ?`;

					let format = [match.round, match.score, match.duration, match.match];

					await this.mysql.query({ sql, format });
				}
			}
		}

		// Make final changes to type of event. Want this in readable text
		if (true) {
			let sql = ``;
			sql += `UPDATE events SET type = 'Grand Slam' WHERE type = 'GS'; `;
			sql += `UPDATE events SET type = 'Masters' WHERE type = '1000'; `;
			sql += `UPDATE events SET type = 'ATP-500' WHERE type = '500'; `;
			sql += `UPDATE events SET type = 'ATP-250' WHERE type = '250'; `;
			sql += `UPDATE events SET type = 'Davis Cup' WHERE type = 'DC'; `;
			sql += `UPDATE events SET type = 'Rod Lavel Cup' WHERE type = 'LVR'; `;
			sql += `UPDATE events SET type = 'United Cup' WHERE type = 'UC'; `;
			await this.mysql.query(sql);
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
