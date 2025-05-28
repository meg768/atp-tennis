const isString = require('yow/isString');
const mysql = require('mysql');
const Probe = require('./probe.js');

class MySQL {
	constructor(options) {
		this.connection = undefined;
		this.log = console.log;
	}


	connect() {
		this.log(`Connecting to database '${process.env.MYSQL_DATABASE}' at ${process.env.MYSQL_HOST}...`);

		let options = {};
		options.host = process.env.MYSQL_HOST;
		options.user = process.env.MYSQL_USER;
		options.password = process.env.MYSQL_PASSWORD;
		options.database = process.env.MYSQL_DATABASE;
		options.port = process.env.MYSQL_PORT;

		// Allow multiple statements
		options.multipleStatements = true;

		if (
			!isString(options.host) ||
			!isString(options.user) ||
			!isString(options.password) ||
			!isString(options.database)
		) {
			throw new Error('MySQL credentials/database not specified.');
		}

		this.disconnect();
		this.connection = mysql.createConnection(options);
	}

	disconnect() {
		if (this.connection != undefined) {
			this.log(`Disconnecting '${process.env.MYSQL_DATABASE}' at ${process.env.MYSQL_HOST}...`);
			this.connection.end();
		}

		this.connection = undefined;
	}

	format() {
		return mysql.format.apply(this, arguments);
	}

	async execute(file) {
		const fs = require('node:fs/promises');
		const data = await fs.readFile(file, { encoding: 'utf8' });

		await this.query(data);
	}

	async query(params) {

		let run = () => {
			if (typeof params === 'string') {
				params = { sql: params };
			}

			let { format, sql, ...options } = params;

			if (format) {
				sql = require('mysql').format(sql, format); // or this.mysql.format(sql, format)
			}

			return new Promise((resolve, reject) => {
				this.connection.query({ sql, ...options }, (error, results) => {
					if (error) {
						console.error('MySQL query error:', error.message);
						reject(error);
					} else {
						resolve(results);
					}
				});
			});

		};


		let probe = new Probe();
		let result = await run();

		this.log(`Query: ${sql}`);
		this.log(`Query executed in ${probe.toString()}`);

		return result;
		
	}

	async queryX(params) {
		let promise = new Promise((resolve, reject) => {
			try {
				if (isString(params)) {
					params = { sql: params };
				}

				let { format, sql, ...options } = params;

				if (format) {
					sql = mysql.format(sql, format);
				}

				this.connection.query({ sql: sql, ...options }, (error, results) => {
					if (error) {
						console.log(error);
						reject(error);
					} else resolve(results);
				});
			} catch (error) {
				reject(error);
			}
		});

		return await promise;
	}

	/*

	query(options) {
		return new Promise((resolve, reject) => {
			try {
				if (isString(options)) {
					options = { sql: options };
				}

				this.connection.query(options, function (error, results) {
					if (error) {
						reject(error);
					} else resolve(results);
				});
			} catch (error) {
				reject(error);
			}
		});
	}
        */

	upsert(table, row) {
		let values = [];
		let columns = [];

		Object.keys(row).forEach(function (column) {
			columns.push(column);
			values.push(row[column]);
		});

		let sql = '';

		sql += this.format('INSERT INTO ?? (??) VALUES (?) ', [table, columns, values]);
		sql += this.format('ON DUPLICATE KEY UPDATE ');

		sql += columns
			.map(column => {
				return this.format('?? = VALUES(??)', [column, column]);
			})
			.join(',');

		return this.query(sql);
	}
}

module.exports = MySQL;
