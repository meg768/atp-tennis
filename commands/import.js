let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');

class Import {
	constructor() {
		this.command = 'import [options]';
		this.describe = 'Import matches';
		this.builder = this.arguments.bind(this);
		this.handler = this.run.bind(this);
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

		for (let index = 1; index < lines.length; index++) {
			let row = {};
			let values = lines[index].split(',');

			if (values.length == columns.length) {
				for (let i = 0; i < columns.length; i++) {
					let value = values[i].replace('\r', '');
					row[columns[i]] = value;
				}

				await this.mysql.upsert('import', row);
			}
		}

		return lines.length - 1;
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
					await this.mysql.query('TRUNCATE TABLE import');
				}

				let from = argv.from;

				for (let year = from; year <= 2025; year++) {
					await this.import(`${year}.csv`);
				}

				await this.import('ongoing_tourneys.csv');
				await this.execute('./sql/matches.sql');
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
