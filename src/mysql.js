const util = require('util');
const isString = require('yow/isString');
const mysql = require('mysql');
const Probe = require('./probe.js');

class MySQL {
	constructor(options) {

		this.connection = undefined;
        this.debug = options?.debug || false;
		this.log = console.log;
		this.error = console.error;
	}

	async connect() {
		this.log(`Connecting to database '${process.env.MYSQL_DATABASE}' at ${process.env.MYSQL_HOST}...`);

		const options = {
			host: process.env.MYSQL_HOST,
			user: process.env.MYSQL_USER,
			password: process.env.MYSQL_PASSWORD,
			database: process.env.MYSQL_DATABASE,
			port: process.env.MYSQL_PORT,
			multipleStatements: true
		};

		if (!isString(options.host) || !isString(options.user) || !isString(options.password) || !isString(options.database)) {
			throw new Error('MySQL credentials/database not specified.');
		}

		await this.disconnect();

		const connection = mysql.createConnection(options);
		const connectAsync = util.promisify(connection.connect).bind(connection);

		try {
			await connectAsync();
			this.connection = connection;
			this.log('✅ Connected to MySQL successfully.');
		} catch (error) {
			this.error('❌ MySQL connection error:', error.message);
			// Don't assign this.connection
			throw error;
		}
	}

	connectX() {
		this.log(`Connecting to database '${process.env.MYSQL_DATABASE}' at ${process.env.MYSQL_HOST}...`);

		let options = {};
		options.host = process.env.MYSQL_HOST;
		options.user = process.env.MYSQL_USER;
		options.password = process.env.MYSQL_PASSWORD;
		options.database = process.env.MYSQL_DATABASE;
		options.port = process.env.MYSQL_PORT;

		// Allow multiple statements
		options.multipleStatements = true;

		if (!isString(options.host) || !isString(options.user) || !isString(options.password) || !isString(options.database)) {
			throw new Error('MySQL credentials/database not specified.');
		}

		this.disconnect();
		this.connection = mysql.createConnection(options);
	}

	async disconnect() {
		if (this.connection !== undefined) {
			this.log(`Disconnecting from '${process.env.MYSQL_DATABASE}' at ${process.env.MYSQL_HOST}...`);

			const endAsync = util.promisify(this.connection.end).bind(this.connection);

			try {
				await endAsync();
				this.log('✅ Disconnected from MySQL.');
			} catch (error) {
				this.error('⚠️ Error while disconnecting:', error.message);
				// Du kan lägga till fallback med connection.destroy() här om du vill
			}
		}

		this.connection = undefined;
	}

	disconnectX() {
		if (this.connection != undefined) {
			this.log(`Disconnecting '${process.env.MYSQL_DATABASE}' at ${process.env.MYSQL_HOST}...`);
			this.connection.end();
		}

		this.connection = undefined;
	}

	async execute(file) {
		const fs = require('node:fs/promises');
		const data = await fs.readFile(file, { encoding: 'utf8' });

		await this.query(data);
	}

	async query(params) {
		if (typeof params === 'string') {
			params = { sql: params };
		}

		let { format, sql, ...options } = params;

		if (format) {
			sql = mysql.format(sql, format);
		}

		let query = () => {
			return new Promise((resolve, reject) => {
				this.connection.query({ sql, ...options }, (error, results) => {
					if (error) {
						this.error('MySQL query error:', error.message);
						reject(error);
					} else {
						resolve(results);
					}
				});
			});
		};

		let probe = new Probe();
		let result = await query();

		//this.log(`${sql}`);

		return result;
	}

	upsert(table, row) {
		let values = [];
		let columns = [];

		Object.keys(row).forEach(function (column) {
			columns.push(column);
			values.push(row[column]);
		});

		let sql = '';

		sql += mysql.format('INSERT INTO ?? (??) VALUES (?) ', [table, columns, values]);
		sql += mysql.format('ON DUPLICATE KEY UPDATE ');

		sql += columns
			.map(column => {
				return mysql.format('?? = VALUES(??)', [column, column]);
			})
			.join(',');

		return this.query(sql);
	}
}

module.exports = new MySQL();
