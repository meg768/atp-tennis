let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');

class Import extends Command {
	constructor() {
		super({ command: 'importx [options]', description: 'Import matches' });
		this.mysql = new MySQL();
	}

	arguments(args) {
		args.option('loop', {
			alias: 'l',
			describe: 'Run again after specified number of days',
			type: 'number',
			default: undefined
		});
		args.option('from', {
			alias: 'f',
			describe: 'Import from year to current date',
			type: 'number',
			default: 1900
		});
		args.option('year', {
			alias: 'y',
			describe: 'Import from year',
			type: 'number',
			default: undefined
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

	async fetchPlayerActivity(url) {
		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Error fetching ATP Tour data:', error);
			return null;
		}
	}

	async importEx({ playerID }) {
		let opponents = await this.import({ playerID });

		if (opponents) {
			for (let opponentID of opponents) {
				await this.import({ playerID: opponentID });
			}
		}
	}

	async import({ playerID }) {
		function translateType(type) {
			switch (type) {
				case 'AS':
					return undefined;
				case 'Q':
					return undefined;
				case 'PZ':
					return undefined;
				case 'CH':
					return undefined;
				case 'FU':
					return undefined;
				case 'DC':
					return 'Davis Cup';
				case 'GS':
					return 'Grand Slam';
				case '1000':
					return 'Masters';
				case '500':
					return 'ATP-500';
				case 'WS':
					return 'ATP-250';
				case '250':
					return 'ATP-250';
				case 'F':
					return 'ATP Finals';
				case 'OL':
					return 'Olympics';
				default:
					return type;
			}
		}

		await this.log(`Importing player ${playerID}...`);

		let url = `https://www.atptour.com/en/-/www/activity/last/${playerID}`;
		let data = await this.fetchPlayerActivity(url);

		if (data === null) {
			return;
		}

		let { Activity: activities } = data;
		let opponents = [];

		for (let activity of activities) {
			let { EventYear: eventYear, Tournaments: tournaments } = activity;


			for (let tournament of tournaments) {
				let id = `${eventYear}-${tournament['EventId']}`;

				let { EventDate: date, Matches: matches, ScDisplayName: name, Surface: surface, EventType: type } = tournament;

				/*
				type = translateType(type);

				if (type === undefined) {
					continue;
				}
					*/
				await this.mysql.upsert('events', { id, name, surface, date, type });

				for (let match of matches) {
					let { OpponentId: opponentID } = match;

					if (opponents.indexOf(opponentID) < 0) {
						opponents.push(opponentID);
					}
				}
			}
		}

		return opponents;
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
					await this.log('Cleaned events table.');
				}

				// Djokovic
				//await this.importEx({ playerID: 'D643' });

				await this.importEx({ playerID: 'b058' });

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
