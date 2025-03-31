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

	async fetchEvent(url) {
		try {
			const response = await fetch(url);

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

		let winner = undefined;
		let loser = undefined;

		if (match['WinningPlayerId'] == match['PlayerTeam1']['PlayerId']) {
			winner = match['PlayerTeam1'];
			loser = match['PlayerTeam2'];
		} else {
			winner = match['PlayerTeam2'];
			loser = match['PlayerTeam1'];
		}

		result.round = match['Round']?.['ShortName'];
		result.winner = winner['PlayerFirstNameFull'] + ' ' + winner['PlayerLastName'];
		result.loser = loser['PlayerFirstNameFull'] + ' ' + loser['PlayerLastName'];

		result.watpid = winner['PlayerId'];
		result.latpid = loser['PlayerId'];

		/*
	result.wseed = match[winnerTeam]['SeedPlayerTeam'] ? parseInt(match[winnerTeam]['SeedPlayerTeam']) : undefined;
	result.lseed = match[loserTeam]['SeedPlayerTeam'] ? parseInt(match[loserTeam]['SeedPlayerTeam']) : undefined;
*/
		result.wioc = winner['PlayerCountryCode'];
		result.lioc = loser['PlayerCountryCode'];
		result.duration = match['MatchTime'];
		result.score = match['ResultString'];

		// Replace "Ret'd" with "RET"
		// This is a workaround for the ATP API, which returns "Ret'd" instead of "RET"
		// in some cases
		result.score = result.score.replace("Ret'd", "RET");

		return result;
	}

	async import(year) {
		await this.log(`Importing year ${year}...`);

		for (let eventID = 1; eventID <= 999; eventID++) {
			let url = `https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear=${year}&eventid=${eventID}`;
			let data = await this.fetchEvent(url);

			if (!data) {
				continue;
			}

			console.log(`Processing event ${eventID}...`);

			let { EventDisplayName: tournament, PlayStartDate: date, EventLevel: level, EventType: type, Matches: matches } = data;

			// Skip Challenger, ITF, WTA 1000, WTA 500, WTA 250
			if (level == 'CH' || level == 'ITF' || level == 'WTA 1000' || level == 'WTA 500' || level == 'WTA 250') {
				continue;
			}

			switch (type) {
				case '250': {
					level = 'ATP-250';
					break;
				}
				case '500': {
					level = 'ATP-500';
					break;
				}
				case '1000': {
					level = 'Masters';
					break;
				}
				case 'OL': {
					level = 'Olympics';
					break;
				}
				case 'GS': {
					level = 'Grand Slam';
					break;
				}
				case 'DC': {
					level = 'Davis Cup';
					break;
				}
				case 'CS': {
					level = 'ATP-500';
					break;
				}
				case 'WS': {
					level = 'ATP-250';
					break;
				}
				case 'WT': {
					level = 'ATP-250';
					break;
				}
			}

			date = new Date(date).toLocaleDateString('sv-SE');

			for (let match of matches) {
				let { NumberOfSets: numberOfSets } = match;

				// Skip matches with 3 sets in Grand Slam (indicates WTA)
				// I am not sure if this is correct, but it seems to be the case
				if (level == 'Grand Slam' && numberOfSets == 3) {
					continue;
				}		

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

					let tourney = { date, name: tournament, url, level, type:null };
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
