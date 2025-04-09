let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');

const ActivityFetcher = require('../src/fetch-activity');
const RankingsFetcher = require('../src/fetch-rankings');
const EventFetcher = require('../src/fetch-event');
const PlayerFetcher = require('../src/fetch-player');

class Import extends Command {
	constructor() {
		super({ command: 'import-archive [options]', description: 'Import matches' });
		this.mysql = new MySQL();
	}

	arguments(args) {
		let year = new Date().getFullYear();

		args.option('loop', {
			alias: 'l',
			describe: 'Run again after specified number of days',
			type: 'number',
			default: false
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

	async importPlayer({ player, players = {} }) {
		let opponents = [];

		if (players[player]) {
			return;
		}

		players[player] = true;

		if (true) {
			let activityFetcher = new ActivityFetcher();
			let activity = await activityFetcher.fetch({ player: player, since: 100 });

			if (!activity || !activity.events) {
				return;
			}

			for (let event of activity.events) {
				let x = { id: event.event, date: event.date, type: event.type, name: event.name };
				await this.mysql.upsert('archive', x);

				for (let match of event.matches) {
					if (match.opponent && !opponents.includes(match.opponent)) {
						opponents.push(match.opponent);
					}
				}
			}
		}

		if (opponents.length > 0) {
			for (let opponent of opponents) {
				await this.importPlayer({ player: opponent, players: players});
			}
		}
	}

	async import() {
		// Sinner
		await this.importPlayer({ player: 'S0AG' });
		// Agassi A092
		//await this.importPlayer({ player: 'A092' });
	}

	async run(argv) {
		this.argv = argv;
		let work = async () => {
			try {
				this.mysql.connect();
				let probe = new Probe();

				if (argv.clean) {
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
