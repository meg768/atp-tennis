let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');

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
			default: 7
		});
		args.option('from', {
			alias: 'f',
			describe: 'Import from year to current date',
			type: 'number',
			default: 2000
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

	async execute(file) {
		await this.log(`Executing file ${file}`);
		await this.mysql.execute(file);
	}

	async fetchEvent(year, eventID) {
		try {

			const response = await fetch(`https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear=${year}&eventid=${eventID}`);

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			let data = await response.json();
			data = data['Data'];
			data = data[0];
			return data;
		} catch (error) {
			console.error('Error fetching ATP Tour data:', error);
			return null;
		}
	}

	parseMatch(match) {
		let result = {};

		if (match['IsDoubles']) {
			return;
		}
		if (match['IsQualifier']) {
			return;
		}
		let winnerTeam = match['Winner'] == '2' ? 'PlayerTeam1' : 'PlayerTeam2';
		let loserTeam = match['Winner'] == '2' ? 'PlayerTeam2' : 'PlayerTeam1';

		result.round = match['Round']?.['ShortName'];
		result.winner = match[winnerTeam]['PlayerFirstNameFull'] + ' ' + match[winnerTeam]['PlayerLastName'];
		result.loser = match[loserTeam]['PlayerFirstNameFull'] + ' ' + match[loserTeam]['PlayerLastName'];

		result.watpid = match[winnerTeam]['PlayerId'];
		result.latpid = match[loserTeam]['PlayerId'];

		/*
	result.wseed = match[winnerTeam]['SeedPlayerTeam'] ? parseInt(match[winnerTeam]['SeedPlayerTeam']) : undefined;
	result.lseed = match[loserTeam]['SeedPlayerTeam'] ? parseInt(match[loserTeam]['SeedPlayerTeam']) : undefined;
*/
		result.wioc = match[winnerTeam]['PlayerCountryCode'];
		result.lioc = match[loserTeam]['PlayerCountryCode'];
		result.duration = match['MatchTime'];
		result.score = match['ResultString'];

		return result;
	}

	async import(year) {

		await this.log(`Importing year ${year}...`);

		for (let eventID = 1; eventID <= 999; eventID++) {
			let data = await this.fetchEvent(year, eventID);

			if (!data) {
				continue;
			}

			let { EventDisplayName: tournament, PlayStartDate: date, EventLevel: level, EventType: type, Matches: matches } = data;

			if (level == 'CH' || level == 'ITF') {
				continue;
			}

			date = new Date(date).toLocaleDateString('sv-SE');

			for (let match of matches) {
				let matchResult = this.parseMatch(match);
				if (matchResult) {
					matchResult = { date, tournament, level, type, ...matchResult };
					console.log(matchResult);
					await this.mysql.upsert('matches', matchResult);

					let winner = {};
					winner.name = matchResult.winner;
					winner.country = matchResult.wioc;
					winner.atpid = matchResult.watpid;
					await this.mysql.upsert('players', winner);

					let loser = {};
					loser.name = matchResult.loser;
					loser.country = matchResult.lioc;
					loser.atpid = matchResult.latpid;
					await this.mysql.upsert('players', loser);

					let tourney = {date, name:tournament, level, type};
					await this.mysql.upsert('tournaments', tourney);
				}
			}
		}
	}

	async run(argv) {
		let work = async () => {
			try {
				this.mysql.connect();
				let probe = new Probe();

				await this.log(`Starting import...`);

				if (argv.clean) {
					await this.mysql.query('TRUNCATE TABLE matches');
					await this.mysql.query('TRUNCATE TABLE players');
					await this.mysql.query('TRUNCATE TABLE tournaments');
				}

				if (argv.year) {
					await this.import(argv.year);
				} else if (argv.from) {
					let from = argv.from;

					for (let year = from; year <= 2025; year++) {
						await this.import(year);
					}
				}

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
