const isString = require('yow/isString');

class Storage {
	constructor() {
		this.mysql = require('../src/mysql.js');
		this.log = console.log;
		this.error = console.error;
	}

	check(key) {
		if (!isString(key)) {
			throw new Error('Key must be a string.');
		}
		if (!this.mysql || !this.mysql.connection) {
			throw new Error('MySQL connection is not established.');
		}
	}

	async get(key, defaultValue = null) {
		this.check(key);

		let sql = 'SELECT value FROM storage WHERE `key` = ?';
		let format = [key];

		this.log(`Fetching value for key: ${key}`);

		let result = await this.mysql.query({ sql, format });

		if (result.length === 0) {
			return defaultValue;
		}

		try {
			return JSON.parse(result[0].value);
		} catch (error) {
			this.error('Error parsing JSON from storage:', error.message);
			return defaultValue;
		}
	}

	async set(key, value) {
		this.check(key);

		if (value == null) {
			return await this.delete(key);
		}

		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			throw new Error('Only plain objects can be saved to storage.');
		}

		this.log(`Setting value for key: ${key}`);

		const existing = await this.get(key, {});
		const merged = { ...existing, ...value };
		const json = JSON.stringify(merged);

		let sql = 'INSERT INTO storage (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?';
		let format = [key, json, json];

		try {
			await this.mysql.query({ sql, format });
		} catch (error) {
			this.error('Error saving value in storage:', error.message);
		}
	}

	async delete(key) {
		this.check(key);

		let sql = 'DELETE FROM storage WHERE `key` = ?';
		let format = [key];

		this.log(`Deleting key: ${key}`);

		try {
			await this.mysql.query({ sql, format });
		} catch (error) {
			this.error('Error deleting key from storage:', error.message);
		}
	}
}

module.exports = new Storage();
