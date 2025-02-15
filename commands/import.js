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
			default: 1968
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

	async downloadFile(fileURL, file) {
		return new Promise((resolve, reject) => {
			const http = require('https');
			const fs = require('fs');

			http.get(fileURL, (response) => {
				if (response.statusCode == 200) {
					let stream = fs.createWriteStream(file);

					response.pipe(stream);

					stream.on('finish', () => {
						stream.close(() => {
							resolve();
						});
					});
				} else {
					response.resume();
					reject(new Error(response.statusMessage));
				}
			}).on('error', (error) => {
				fs.unlink(file, () => {
					reject(error);
				});
			});
		});
	}

	transformRow(row) {
		let { tourney_date, tourney_name, tourney_level, surface, draw_size } = row;
		let { minutes, round, score } = row;
		let { winner_name, winner_ioc, winner_id, winner_rank, winner_hand } = row;
		let { loser_name, loser_ioc, loser_id, loser_rank, loser_hand } = row;
		let { w_svpt, w_ace, w_df, w_1stIn, w_SvGms } = row;
		let { l_svpt, l_ace, l_df, l_1stIn, l_SvGms } = row;

		let toInt = (value) => {
			value = parseInt(value);
			return Number.isNaN(value) ? undefined : value;
		};

		let toPlayerStyle = (value) => {
			switch (value) {
				case 'L':
					return 'Left';
				case 'R':
					return 'Right';
			}
			return undefined;
		};

		let toTournamentLevel = (value) => {
			switch (value) {
				case 'G': {
					return 'Grand Slam';
				}
				case 'M': {
					return 'Masters';
				}
				case 'D': {
					return 'Davis Cup';
				}
				case 'A': {
					return 'ATP-Tour';
				}
				case 'F': {
					return 'Finals';
				}
				case 'O': {
					return 'Olympics';
				}
			}
			return value;
		};

		let toPercentage = (value, max) => {
			return max > 0 ? Math.round((1000 * value) / max) / 10 : undefined;
		};

		minutes = toInt(minutes);
		draw_size = toInt(draw_size);

		// Convert to integers
		w_svpt = toInt(w_svpt);
		l_svpt = toInt(l_svpt);

		w_ace = toInt(w_ace);
		l_ace = toInt(l_ace);

		w_df = toInt(w_df);
		l_df = toInt(l_df);

		w_1stIn = toInt(w_1stIn);
		l_1stIn = toInt(l_1stIn);

		winner_rank = toInt(winner_rank);
		loser_rank = toInt(loser_rank);

		w_SvGms = toInt(w_SvGms);
		l_SvGms = toInt(l_SvGms);

		let match = {};

		match.date = tourney_date;
		match.tournament = tourney_name;
		match.level = tourney_level;
		match.draw = draw_size;
		match.surface = surface;
		match.level = toTournamentLevel(tourney_level);

		match.round = round;
		match.winner = winner_name;
		match.loser = loser_name;
		match.score = score;
		match.duration = minutes;

		match.wioc = winner_ioc;
		match.lioc = loser_ioc;

		match.wrk = winner_rank;
		match.lrk = loser_rank;

		match.wsg = w_SvGms;
		match.lsg = l_SvGms;

		match.wace = toPercentage(w_ace, w_svpt);
		match.lace = toPercentage(l_ace, l_svpt);

		match.wdf = toPercentage(w_df, w_svpt);
		match.ldf = toPercentage(l_df, l_svpt);

		match.wfsi = toPercentage(w_1stIn, w_svpt);
		match.lfsi = toPercentage(l_1stIn, l_svpt);

		match.watpid = winner_id;
		match.latpid = loser_id;

		match.wstyle = toPlayerStyle(winner_hand);
		match.lstyle = toPlayerStyle(loser_hand);

		match.wsp = w_svpt;
		match.lsp = l_svpt;

		return match;
	}

	async upsertFile(file) {
		const fs = require('node:fs/promises');

		let content = await fs.readFile(file);
		let text = content.toString();

		text = text.replace('\r\n', '\n');
		text = text.replace('\r', '\n');

		let lines = text.split('\n');
		let columns = lines.shift().split(',');

		for (let line of lines) {
			let row = {};
			let values = line.split(',');

			if (values.length == columns.length) {
				for (let index = 0; index < columns.length; index++) {
					row[columns[index]] = values[index].replace('\r', '').trim();
				}

				try {
					let match = this.transformRow(row);

					await this.mysql.upsert('matches', match);

					await this.mysql.upsert('players', {
						name: match.winner,
						country: match.wioc,
						style: match.wstyle,
						atpid: match.watpid
					});
					await this.mysql.upsert('players', {
						name: match.loser,
						country: match.lioc,
						style: match.lstyle,
						atpid: match.latpid
					});
					await this.mysql.upsert('tournaments', {
						date: match.date,
						name: match.tournament,
						surface: match.surface,
						level: match.level,
						draw: match.draw
					});
				} catch (error) {
					await this.log(error.message);

				}
			}
		}

		return lines.length;
	}

	async importCSV(src) {
		let probe = new Probe();
		let dst = `./downloads/download.csv`;

		await this.log(`Importing ${src}...`);

		await this.downloadFile(src, dst);

		let matchCount = await this.upsertFile(dst);

		await this.log(`Imported ${matchCount} matches from ${src} completed in ${probe.toString()}.`);
	}

	async import(file) {
		let probe = new Probe();
		let src = `https://raw.githubusercontent.com/Tennismylife/TML-Database/refs/heads/master/${file}`;
		let dst = `./downloads/${file}`;

		await this.log(`Importing ${file}...`);

		await this.downloadFile(src, dst);

		let matchCount = await this.upsertFile(dst);

		await this.log(`Imported ${matchCount} matches from ${file} completed in ${probe.toString()}.`);
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
					await this.import(`${argv.year}.csv`);
				} else if (argv.from) {
					let from = argv.from;

					for (let year = from; year <= 2025; year++) {
						await this.import(`${year}.csv`);
					}

					await this.import('ongoing_tourneys.csv');
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
