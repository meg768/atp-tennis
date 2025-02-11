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
			default: 3
		});
		args.option('from', {
			alias: 'f',
			describe: 'Import from year to current date',
			type: 'number',
			default: 2020
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

	async upsertFile(file) {
		const fs = require('node:fs/promises');

		let content = await fs.readFile(file);
		let text = content.toString();

		text = text.replace('\r\n', '\n');
		text = text.replace('\r', '\n');

		let lines = text.split('\n');
		let columns = lines[0].split(',');

		let transform = (row) => {
			let toInt = (value) => {
				value = parseInt(value);
				return Number.isNaN(value) ? undefined : value;
			};

			row.minutes = toInt(row.minutes);
			row.draw_size = toInt(row.draw_size);

			// Convert to integers
			row.w_svpt = toInt(row.w_svpt);
			row.l_svpt = toInt(row.l_svpt);

			row.w_ace = toInt(row.w_ace);
			row.l_ace = toInt(row.l_ace);

			row.w_df = toInt(row.w_df);
			row.l_df = toInt(row.l_df);

			row.w_1stIn = toInt(row.w_1stIn);
			row.l_1stIn = toInt(row.l_1stIn);

			row.winner_rank = toInt(row.winner_rank);
			row.loser_rank = toInt(row.loser_rank);

			row.w_SvGms = toInt(row.w_SvGms);
			row.l_SvGms = toInt(row.l_SvGms);

			let data = {};
			data.date = row.tourney_date;
			data.tournament = row.tourney_name;
			data.level = row.tourney_level;
			data.draw = row.draw_size;
			data.surface = row.surface;

			switch (row.tourney_level) {
				case 'G': {
					data.level = 'Grand Slam';
					break;
				}
				case 'M': {
					data.level = 'Masters';
					break;
				}
				case 'D': {
					data.level = 'Davis Cup';
					break;
				}
				case 'A': {
					data.level = 'ATP-Tour';
					break;
				}
				case 'O': {
					data.level = 'Olympics';
					break;
				}
			}

			data.round = row.round;
			data.winner = row.winner_name;
			data.loser = row.loser_name;
			data.score = row.score;
			data.duration = row.minutes;

			data.WIOC = row.winner_ioc;
			data.LIOC = row.loser_ioc;

			data.WRK = row.winner_rank;
			data.LRK = row.loser_rank;

			data.WSG = row.w_SvGms;
			data.LSG = row.l_SvGms;

			data.WACE = row.w_svpt > 0 ? Math.round((1000 * row.w_ace) / row.w_svpt) / 10 : undefined;
			data.LACE = row.l_svpt > 0 ? Math.round((1000 * row.l_ace) / row.l_svpt) / 10 : undefined;

			data.WDF = row.w_svpt > 0 ? Math.round((1000 * row.w_df) / row.w_svpt) / 10 : undefined;
			data.LDF = row.l_svpt > 0 ? Math.round((1000 * row.l_df) / row.l_svpt) / 10 : undefined;

			data.WFSI = row.w_svpt > 0 ? Math.round((1000 * row.w_1stIn) / row.w_svpt) / 10 : undefined;
			data.LFSI = row.l_svpt > 0 ? Math.round((1000 * row.l_1stIn) / row.l_svpt) / 10 : undefined;

			data.wid = row.winner_id;
			data.lid = row.loser_id;

			return data;
		};

		for (let index = 1; index < lines.length; index++) {
			let row = {};
			let values = lines[index].split(',');

			if (values.length == columns.length) {
				for (let i = 0; i < columns.length; i++) {
					let value = values[i].replace('\r', '');
					row[columns[i]] = value;
				}

				let data = transform(row);

				let winner = {};
				winner.id = row.winner_id;
				winner.name = row.winner_name;
				winner.country = row.winner_ioc;
				winner.style = row.winner_hand == '' ? undefined : row.winner_hand;

				let loser = {};
				loser.id = row.loser_id;
				loser.name = row.loser_name;
				loser.country = row.loser_ioc;
				loser.style = row.loser_hand == '' ? undefined : row.loser_hand;

				await this.mysql.upsert('matches', data);
				await this.mysql.upsert('players', winner);
				await this.mysql.upsert('players', loser);
			}
		}

		return lines.length - 1;
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
				}

				let from = argv.from;

				for (let year = from; year <= 2025; year++) {
					await this.import(`${year}.csv`);
				}

				await this.import('ongoing_tourneys.csv');

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
