const util = require('util');
const mysql = require('mysql');

const Command = require('../src/command.js');

const ATP_BASE_URL = 'https://www.atptour.com';
const ATP_APP_URL = 'https://app.atptour.com';
const DEFAULT_DELAY_MS = 500;
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_LOOP_DAYS = 0;
const SKIPPED_ACTIVITY_EVENT_TYPES = new Set(['CH', 'FU', 'Q', 'ATPC']);
const SURFACES = ['Clay', 'Grass', 'Hard'];

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function isTruthyFlag(value) {
	if (typeof value === 'boolean') {
		return value;
	}

	if (typeof value === 'number') {
		return value !== 0;
	}

	if (typeof value === 'string') {
		return !['0', 'false', 'no', 'off', ''].includes(value.trim().toLowerCase());
	}

	return Boolean(value);
}

function toDateString(value) {
	if (!value) {
		return null;
	}

	if (typeof value === 'string') {
		const trimmed = value.trim();

		if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
			return trimmed.slice(0, 10);
		}

		const parsed = new Date(trimmed);

		if (!Number.isNaN(parsed.getTime())) {
			return parsed.toISOString().slice(0, 10);
		}
	}

	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString().slice(0, 10);
	}

	return null;
}

function toInteger(value) {
	if (value == null || value === '') {
		return null;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function moneyToInteger(value) {
	if (value == null || value === '') {
		return null;
	}

	const digits = String(value).replace(/[^0-9-]/g, '');
	return digits ? toInteger(digits) : null;
}

function normalizePlayerId(value) {
	if (value == null) {
		return null;
	}

	const normalized = String(value).trim().toUpperCase();
	return normalized || null;
}

function isValidPlayerId(value) {
	return /^[A-Z0-9]{4}$/.test(normalizePlayerId(value) || '');
}

function absoluteUrl(value) {
	if (!value) {
		return null;
	}

	if (/^https?:\/\//i.test(value)) {
		return value;
	}

	if (String(value).startsWith('/')) {
		return `${ATP_BASE_URL}${value}`;
	}

	return `${ATP_BASE_URL}/${String(value).replace(/^\/+/, '')}`;
}

function normalizeEventType(rawType) {
	if (rawType == null) {
		return null;
	}

	const value = String(rawType).trim();

	if (!value) {
		return null;
	}

	const mapped = {
		PZ: 'Prize Money',
		GC: 'Grand Championship',
		GP: 'Grand Prix',
		WT: 'World Tour',
		GS: 'Grand Slam',
		OL: 'Olympics',
		'1000': 'Masters',
		'500': 'ATP-500',
		'250': 'ATP-250',
		LVR: 'Rod Laver Cup',
		DC: 'Davis Cup',
		WC: 'World Championship',
		WS: 'World Series',
		CS: 'Championship Series',
		UC: 'United Cup',
		XXI: 'Next Gen Finals'
	};

	return mapped[value] || value;
}

function normalizeSurface(rawSurface) {
	if (rawSurface == null) {
		return null;
	}

	const value = String(rawSurface).trim().toLowerCase();

	if (!value) {
		return null;
	}

	const mapped = {
		hard: 'Hard',
		clay: 'Clay',
		grass: 'Grass',
		carpet: 'Carpet'
	};

	return mapped[value] || String(rawSurface).trim();
}

function normalizeSetToken(token) {
	if (!token) {
		return null;
	}

	function splitCompactGames(value) {
		if (!/^\d+$/.test(value)) {
			return null;
		}

		if (value.length === 2) {
			return [value[0], value[1]];
		}

		if (value.length === 3) {
			return [value[0], value.slice(1)];
		}

		if (value.length === 4) {
			return [value.slice(0, 2), value.slice(2)];
		}

		return null;
	}

	function normalizeTieBreakSet(leftGames, leftTieBreak, rightGames, rightTieBreak) {
		const left = String(parseInt(leftGames, 10));
		const right = String(parseInt(rightGames, 10));

		if (leftTieBreak == null && rightTieBreak == null) {
			return `${left}-${right}`;
		}

		if (leftTieBreak != null && rightTieBreak != null) {
			const loserTieBreak = parseInt(left, 10) < parseInt(right, 10) ? leftTieBreak : rightTieBreak;
			return `${left}-${right}(${parseInt(loserTieBreak, 10)})`;
		}

		return `${left}-${right}(${parseInt(leftTieBreak ?? rightTieBreak, 10)})`;
	}

	let match = token.match(/^(\d+)-(\d+)$/);
	if (match) {
		return `${parseInt(match[1], 10)}-${parseInt(match[2], 10)}`;
	}

	match = token.match(/^(\d+)-(\d+)\((\d+)\)$/);
	if (match) {
		return normalizeTieBreakSet(match[1], null, match[2], match[3]);
	}

	match = token.match(/^(\d+)\((\d+)\)-(\d+)\((\d+)\)$/);
	if (match) {
		return normalizeTieBreakSet(match[1], match[2], match[3], match[4]);
	}

	match = token.match(/^(\d+)\((\d+)\)(\d+)\((\d+)\)$/);
	if (match) {
		return normalizeTieBreakSet(match[1], match[2], match[3], match[4]);
	}

	match = token.match(/^(\d+)(\d+)\((\d+)\)$/);
	if (match) {
		const games = splitCompactGames(`${match[1]}${match[2]}`);
		return games ? normalizeTieBreakSet(games[0], null, games[1], match[3]) : null;
	}

	match = token.match(/^(\d+)\((\d+)\)(\d+)$/);
	if (match) {
		const games = splitCompactGames(`${match[1]}${match[3]}`);
		return games ? normalizeTieBreakSet(games[0], match[2], games[1], null) : null;
	}

	const compact = splitCompactGames(token);
	return compact ? `${parseInt(compact[0], 10)}-${parseInt(compact[1], 10)}` : null;
}

function normalizeScore(rawScore) {
	if (rawScore == null) {
		return null;
	}

	const trimmed = String(rawScore).trim();

	if (!trimmed) {
		return null;
	}

	let working = trimmed
		.replace(/\b(RET(?:['']?D)?|RETIREMENT|W\/O|WO|WALKOVER|DEF|ABD|ABANDONED)\b\.?/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	if (!working) {
		return null;
	}

	const tokens = working.split(/\s+/);
	const normalizedTokens = [];

	for (const token of tokens) {
		const normalized = normalizeSetToken(token);

		if (!normalized) {
			return working;
		}

		normalizedTokens.push(normalized);
	}

	return normalizedTokens.length ? normalizedTokens.join(' ') : null;
}

function normalizeDuration(rawDuration) {
	if (rawDuration == null) {
		return null;
	}

	const value = String(rawDuration).trim();

	if (!value || value === '00:00:00') {
		return null;
	}

	if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
		return value.slice(0, 5);
	}

	if (/^\d{1,2}:\d{2}$/.test(value)) {
		return value;
	}

	return null;
}

function deriveMatchStatus(match) {
	const text = [match?.MatchStateReasonMessage, match?.Message, match?.ResultString]
		.filter(Boolean)
		.join(' ')
		.toUpperCase();

	if (/\b(W\/O|WO|WALKOVER)\b/.test(text)) {
		return 'Walkover';
	}

	if (/\b(RET|RET'D|RETD|RETIREMENT|DEF|ABD|ABANDONED)\b/.test(text)) {
		return 'Aborted';
	}

	if (match?.Status === 'F') {
		return 'Completed';
	}

	if (!match?.ResultString || !String(match.ResultString).trim()) {
		return 'Unknown';
	}

	return 'Completed';
}

function parseNormalizedSetToken(token) {
	const clean = token.replace(/\(\d+\)/g, '');
	const match = clean.match(/^(\d+)-(\d+)$/);

	if (!match) {
		return null;
	}

	return [parseInt(match[1], 10), parseInt(match[2], 10)];
}

function isCompletedSet(a, b) {
	const high = Math.max(a, b);
	const low = Math.min(a, b);
	const diff = high - low;

	if (high < 6) {
		return false;
	}

	if (high === 6) {
		return diff >= 2;
	}

	if (high === 7) {
		return low === 5 || low === 6;
	}

	return diff === 2;
}

function getScoreIndex(score) {
	if (typeof score !== 'string' || score.trim() === '') {
		return null;
	}

	const normalized = normalizeScore(score);

	if (typeof normalized !== 'string' || normalized.trim() === '') {
		return null;
	}

	let completedSets = 0;
	let totalGames = 0;

	for (const token of normalized.split(/\s+/)) {
		const games = parseNormalizedSetToken(token);

		if (!games) {
			return null;
		}

		if (!isCompletedSet(games[0], games[1])) {
			return null;
		}

		completedSets++;
		totalGames += games[0] + games[1];
	}

	if (completedSets < 2) {
		return null;
	}

	return 1 - (totalGames - 6 * completedSets) / (7 * completedSets);
}

function calculateKFactor(matchesPlayed) {
	return 250 / Math.pow(matchesPlayed + 5, 0.4);
}

class CodexDatabase {
	constructor({ host, user, password, port, database, log }) {
		this.host = host;
		this.user = user;
		this.password = password;
		this.port = port;
		this.database = database;
		this.log = log || console.log;
		this.connection = null;
	}

	get baseOptions() {
		return {
			host: this.host,
			user: this.user,
			password: this.password,
			port: this.port,
			multipleStatements: true
		};
	}

	async ensureDatabase() {
		if (!this.host || !this.user || typeof this.password !== 'string' || !this.database) {
			throw new Error('MYSQL host/user/password and MYSQL_CODEX_DATABASE must be set.');
		}

		const connection = mysql.createConnection(this.baseOptions);
		const connectAsync = util.promisify(connection.connect).bind(connection);
		const queryAsync = util.promisify(connection.query).bind(connection);
		const endAsync = util.promisify(connection.end).bind(connection);

		try {
			await connectAsync();
			await queryAsync(
				`CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(this.database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
			);
		} finally {
			await endAsync().catch(() => {});
		}
	}

	async connect() {
		await this.disconnect();

		const connection = mysql.createConnection({
			...this.baseOptions,
			database: this.database
		});

		const connectAsync = util.promisify(connection.connect).bind(connection);
		await connectAsync();
		this.connection = connection;
	}

	async disconnect() {
		if (!this.connection) {
			return;
		}

		const endAsync = util.promisify(this.connection.end).bind(this.connection);
		await endAsync().catch(() => {});
		this.connection = null;
	}

	async query(params) {
		if (!this.connection) {
			throw new Error('Database is not connected.');
		}

		if (typeof params === 'string') {
			params = { sql: params };
		}

		let { sql, format, ...options } = params;

		if (format) {
			sql = mysql.format(sql, format);
		}

		const queryAsync = util.promisify(this.connection.query).bind(this.connection);
		return await queryAsync({ sql, ...options });
	}

	async upsert(table, row) {
		const columns = Object.keys(row);
		const values = columns.map(column => row[column]);

		let sql = '';
		sql += mysql.format('INSERT INTO ?? (??) VALUES (?) ', [table, columns, values]);
		sql += 'ON DUPLICATE KEY UPDATE ';
		sql += columns.map(column => mysql.format('?? = VALUES(??)', [column, column])).join(', ');

		return await this.query(sql);
	}
}

class ATPClient {
	constructor({ delayMs = DEFAULT_DELAY_MS, timeoutMs = DEFAULT_TIMEOUT_MS, retryCount = DEFAULT_RETRY_COUNT, log }) {
		this.delayMs = delayMs;
		this.timeoutMs = timeoutMs;
		this.retryCount = retryCount;
		this.log = log || console.log;
	}

	async fetchJSON(url) {
		const headers = {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
			Accept: 'application/json',
			Referer: `${ATP_APP_URL}/`,
			Origin: ATP_APP_URL
		};

		let lastError = null;

		for (let attempt = 1; attempt <= this.retryCount; attempt++) {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

			try {
				if (this.delayMs > 0) {
					await sleep(this.delayMs);
				}

				const response = await fetch(url, { headers, signal: controller.signal });
				const contentType = response.headers.get('content-type') || '';
				const bodyText = await response.text();

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}

				if (!contentType.includes('application/json')) {
					throw new Error(`Expected JSON but got ${contentType || 'unknown content-type'}`);
				}

				return JSON.parse(bodyText);
			} catch (error) {
				lastError = error;

				if (attempt < this.retryCount) {
					await sleep(Math.min(5000, attempt * 1000));
				}
			} finally {
				clearTimeout(timeout);
			}
		}

		throw new Error(`Failed to fetch ${url}: ${lastError?.message || 'Unknown error'}`);
	}

	async fetchRankings(top) {
		const url = `${ATP_APP_URL}/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=${top}`;
		return await this.fetchJSON(url);
	}

	async fetchActivity(playerId) {
		return await this.fetchJSON(`${ATP_BASE_URL}/en/-/www/activity/last/${normalizePlayerId(playerId)}`);
	}

	async fetchScores(eventId) {
		const [eventYear, eventCode] = String(eventId).split('-');

		if (!eventYear || !eventCode) {
			throw new Error(`Invalid event id '${eventId}'.`);
		}

		return await this.fetchJSON(`${ATP_APP_URL}/api/gateway/scores.resultsarchive?eventyear=${eventYear}&eventid=${eventCode}`);
	}

	async fetchPlayer(playerId) {
		return await this.fetchJSON(`${ATP_BASE_URL}/en/-/www/players/hero/${normalizePlayerId(playerId)}`);
	}

	async fetchStats() {
		const endpoints = {
			serve: `${ATP_BASE_URL}/en/-/www/StatsLeaderboard/serve/52week/all/all/false?v=1`,
			return: `${ATP_BASE_URL}/en/-/www/StatsLeaderboard/return/52week/all/all/false?v=1`,
			pressure: `${ATP_BASE_URL}/en/-/www/StatsLeaderboard/pressure/52week/all/all/false?v=1`
		};

		const payload = {};

		for (const [key, url] of Object.entries(endpoints)) {
			payload[key] = await this.fetchJSON(url);
		}

		return payload;
	}
}

class CodexImport extends Command {
	constructor() {
		super({ command: 'import-codex [options]', description: 'Import ATP data into MYSQL_CODEX_DATABASE' });
		this.db = null;
		this.client = null;
		this.statusKey = 'import-codex.status';
		this.summary = {};
	}

	arguments(args) {
		const currentYear = new Date().getFullYear();

		args.option('top', {
			alias: 't',
			describe: 'Start discovery from top X ATP players',
			type: 'number',
			default: 100
		});

		args.option('since', {
			alias: 's',
			describe: 'Import activity/events since this year',
			type: 'number',
			default: currentYear - 1
		});

		args.option('clean', {
			alias: 'c',
			describe: 'Truncate codex tables before import',
			type: 'boolean',
			default: false
		});

		args.option('loop', {
			alias: 'l',
			describe: 'Run again after specified number of days',
			type: 'number',
			default: DEFAULT_LOOP_DAYS
		});

		args.option('init', {
			describe: 'Create database schema if missing',
			type: 'boolean',
			default: true
		});

		args.option('stats', {
			describe: 'Fetch ATP serve/return/pressure ratings',
			type: 'boolean',
			default: true
		});

		args.option('elo', {
			describe: 'Compute total and surface-specific ELO ratings',
			type: 'boolean',
			default: true
		});

		args.option('delay', {
			describe: 'Delay between ATP requests in milliseconds',
			type: 'number',
			default: DEFAULT_DELAY_MS
		});

		args.option('timeout', {
			describe: 'ATP request timeout in milliseconds',
			type: 'number',
			default: DEFAULT_TIMEOUT_MS
		});

		args.help();
	}

	async run(argv) {
		this.argv = argv;

		const executeOnce = async () => {
			const startedAt = new Date().toISOString();
			this.summary = {
				startedAt,
				top: argv.top,
				since: argv.since,
				events: 0,
				matches: 0,
				players: 0,
				errors: 0
			};

			this.db = new CodexDatabase({
				host: process.env.MYSQL_HOST,
				user: process.env.MYSQL_USER,
				password: process.env.MYSQL_PASSWORD,
				port: process.env.MYSQL_PORT,
				database: process.env.MYSQL_CODEX_DATABASE,
				log: console.log
			});

			this.client = new ATPClient({
				delayMs: Number.isFinite(Number(argv.delay)) ? Math.max(0, Math.trunc(Number(argv.delay))) : DEFAULT_DELAY_MS,
				timeoutMs: Number.isFinite(Number(argv.timeout)) ? Math.max(1000, Math.trunc(Number(argv.timeout))) : DEFAULT_TIMEOUT_MS,
				log: console.log
			});

			try {
				await this.db.ensureDatabase();
				await this.db.connect();

				if (isTruthyFlag(argv.init)) {
					await this.ensureSchema();
				}

				await this.updateStatus({ startedAt, running: true, success: null, summary: this.summary });
				await this.writeLog(`import-codex started for database '${process.env.MYSQL_CODEX_DATABASE}'.`);

				if (isTruthyFlag(argv.clean)) {
					await this.cleanDatabase();
				}

				const rankings = await this.fetchRankings();
				await this.seedRankedPlayers(rankings.players);

				const discovery = await this.discover(rankings.players);
				const imported = await this.fetchEventArchives(discovery.events);

				await this.saveEvents(imported.events);
				await this.saveMatches(imported.matches);

				const playerIds = new Set([
					...rankings.players.map(player => player.player),
					...discovery.players,
					...imported.players
				]);

				await this.fetchAndSavePlayers(playerIds);
				await this.syncRankingSnapshot(rankings.players);
				await this.updateMatchRanks();

				if (isTruthyFlag(argv.stats)) {
					await this.syncStats();
				}

				await this.updateSurfaceFactors();

				if (isTruthyFlag(argv.elo)) {
					await this.updateElo();
				}

				this.summary.finishedAt = new Date().toISOString();
				this.summary.success = true;
				await this.updateStatus({
					startedAt,
					finishedAt: this.summary.finishedAt,
					running: false,
					success: true,
					summary: this.summary
				});
				await this.writeLog(`import-codex finished successfully.`);
			} catch (error) {
				this.summary.finishedAt = new Date().toISOString();
				this.summary.success = false;
				await this.writeLog(`FATAL ERROR: ${error.message}`);
				await this.updateStatus({
					startedAt,
					finishedAt: this.summary.finishedAt,
					running: false,
					success: false,
					error: error.message,
					summary: this.summary
				});
				console.error(error.stack);
				throw error;
			} finally {
				await this.db?.disconnect().catch(() => {});
			}
		};

		await executeOnce();

		if (Number(argv.loop) > 0) {
			const loopMs = Number(argv.loop) * 24 * 60 * 60 * 1000;
			console.log(`Waiting ${argv.loop} days before next import-codex run.`);

			setTimeout(() => {
				this.run(argv).catch(error => console.error(error.stack));
			}, loopMs);
		}
	}

	async ensureSchema() {
		await this.db.query(`
			CREATE TABLE IF NOT EXISTS events (
				id VARCHAR(20) NOT NULL DEFAULT '',
				date DATE DEFAULT NULL,
				name VARCHAR(100) DEFAULT NULL,
				location VARCHAR(100) DEFAULT NULL,
				type VARCHAR(50) DEFAULT NULL,
				surface VARCHAR(50) DEFAULT NULL,
				url VARCHAR(255) DEFAULT NULL,
				PRIMARY KEY (id),
				KEY idx_events_date (date),
				KEY idx_events_type (type),
				KEY idx_events_surface (surface)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
		`);

		await this.db.query(`
			CREATE TABLE IF NOT EXISTS players (
				id VARCHAR(32) NOT NULL DEFAULT '',
				name VARCHAR(64) DEFAULT NULL,
				country VARCHAR(16) DEFAULT NULL,
				age INT DEFAULT NULL,
				birthdate DATE DEFAULT NULL,
				pro INT DEFAULT NULL,
				active TINYINT(1) DEFAULT NULL,
				height INT DEFAULT NULL,
				weight INT DEFAULT NULL,
				rank INT DEFAULT NULL,
				highest_rank INT DEFAULT NULL,
				highest_rank_date DATE DEFAULT NULL,
				career_wins INT DEFAULT NULL,
				career_losses INT DEFAULT NULL,
				career_titles INT DEFAULT NULL,
				career_prize INT DEFAULT NULL,
				ytd_wins INT DEFAULT NULL,
				ytd_losses INT DEFAULT NULL,
				ytd_titles INT DEFAULT NULL,
				ytd_prize INT DEFAULT NULL,
				coach VARCHAR(255) DEFAULT NULL,
				points INT DEFAULT NULL,
				serve_rating DOUBLE DEFAULT NULL,
				return_rating DOUBLE DEFAULT NULL,
				pressure_rating DOUBLE DEFAULT NULL,
				elo_rank INT DEFAULT NULL,
				elo_rank_clay INT DEFAULT NULL,
				elo_rank_grass INT DEFAULT NULL,
				elo_rank_hard INT DEFAULT NULL,
				hard_factor INT DEFAULT NULL,
				clay_factor INT DEFAULT NULL,
				grass_factor INT DEFAULT NULL,
				url VARCHAR(255) DEFAULT NULL,
				image_url VARCHAR(255) DEFAULT NULL,
				PRIMARY KEY (id),
				KEY idx_players_rank (rank),
				KEY idx_players_country (country),
				KEY idx_players_active (active)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
		`);

		await this.db.query(`
			CREATE TABLE IF NOT EXISTS matches (
				id VARCHAR(50) NOT NULL DEFAULT '',
				event VARCHAR(20) DEFAULT NULL,
				round VARCHAR(50) DEFAULT NULL,
				winner VARCHAR(32) DEFAULT NULL,
				loser VARCHAR(32) DEFAULT NULL,
				winner_rank INT DEFAULT NULL,
				loser_rank INT DEFAULT NULL,
				score VARCHAR(100) DEFAULT NULL,
				status ENUM('Completed', 'Aborted', 'Walkover', 'Unknown') DEFAULT NULL,
				duration VARCHAR(10) DEFAULT NULL,
				PRIMARY KEY (id),
				KEY idx_matches_event (event),
				KEY idx_matches_winner (winner),
				KEY idx_matches_loser (loser),
				KEY idx_matches_round (round)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
		`);

		await this.db.query(`
			CREATE TABLE IF NOT EXISTS log (
				timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
				message TEXT DEFAULT NULL
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
		`);

		await this.db.query(`
			CREATE TABLE IF NOT EXISTS settings (
				\`key\` VARCHAR(100) NOT NULL DEFAULT '',
				value LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(value)),
				PRIMARY KEY (\`key\`)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
		`);

		await this.ensureFlatlyView();
	}

	async ensureFlatlyView() {
		const sql = `
			CREATE VIEW flatly AS
			SELECT
				m.id AS id,
				e.date AS event_date,
				e.id AS event_id,
				e.name AS event_name,
				e.location AS event_location,
				e.type AS event_type,
				e.surface AS event_surface,
				m.round AS round,
				pw.name AS winner,
				pl.name AS loser,
				pw.id AS winner_id,
				m.winner_rank AS winner_rank,
				pl.id AS loser_id,
				m.loser_rank AS loser_rank,
				m.score AS score,
				m.status AS status,
				m.duration AS duration
			FROM matches m
			LEFT JOIN players pw ON m.winner = pw.id
			LEFT JOIN players pl ON m.loser = pl.id
			LEFT JOIN events e ON m.event = e.id
			ORDER BY e.date, m.id
		`;

		try {
			await this.db.query('DROP VIEW IF EXISTS flatly');
			await this.db.query(sql);
		} catch (error) {
			await this.logError('creating view flatly', error);
		}
	}

	async cleanDatabase() {
		await this.writeLog('Cleaning codex tables...');
		await this.db.query('TRUNCATE TABLE matches');
		await this.db.query('TRUNCATE TABLE events');
		await this.db.query('TRUNCATE TABLE players');
		await this.db.query({
			sql: 'DELETE FROM settings WHERE `key` = ?',
			format: [this.statusKey]
		});
		await this.writeLog('Codex tables truncated.');
	}

	async writeLog(message) {
		console.log(message);

		if (!this.db?.connection) {
			return;
		}

		try {
			await this.db.query({
				sql: 'INSERT INTO log(message) VALUES (?)',
				format: [message]
			});
		} catch (error) {
		}
	}

	async logError(message, error) {
		this.summary.errors += 1;
		const suffix = error ? `: ${error.message}` : '';
		await this.writeLog(`ERROR ${message}${suffix}`);
	}

	async updateStatus(payload) {
		if (!this.db?.connection) {
			return;
		}

		try {
			await this.db.upsert('settings', {
				key: this.statusKey,
				value: JSON.stringify(payload)
			});
		} catch (error) {
			console.error(error.message);
		}
	}

	async fetchRankings() {
		await this.writeLog(`Fetching ATP rankings (top ${this.argv.top})...`);
		const raw = await this.client.fetchRankings(this.argv.top);

		if (!Array.isArray(raw?.Data?.Rankings?.Players)) {
			throw new Error('ATP rankings payload did not contain Rankings.Players.');
		}

		const players = raw.Data.Rankings.Players
			.map(player => ({
				date: toDateString(raw.Data.Rankings.RankDate),
				player: normalizePlayerId(player.PlayerId),
				name: `${player.FirstName} ${player.LastName}`.trim(),
				age: toInteger(player.AgeAtRankDate),
				country: player.NatlId || null,
				rank: toInteger(player.Rank),
				points: toInteger(player.Points)
			}))
			.filter(player => isValidPlayerId(player.player));

		await this.writeLog(`Fetched ${players.length} ranked players.`);
		return { players };
	}

	async seedRankedPlayers(players) {
		for (const player of players) {
			await this.db.upsert('players', {
				id: player.player,
				name: player.name,
				country: player.country,
				rank: player.rank,
				points: player.points
			});
		}
	}

	parseActivity(playerId, raw) {
		if (!Array.isArray(raw?.Activity)) {
			return { events: [], opponents: [] };
		}

		const events = [];
		const opponents = new Set();

		for (const activity of raw.Activity) {
			if (toInteger(activity.EventYear) < this.argv.since) {
				continue;
			}

			for (const tournament of activity.Tournaments || []) {
				if (SKIPPED_ACTIVITY_EVENT_TYPES.has(tournament.EventType)) {
					continue;
				}

				const eventId = `${activity.EventYear}-${tournament.EventId}`;
				const event = {
					id: eventId,
					date: toDateString(tournament.EventDate),
					name: tournament.ScDisplayName || tournament.EventDisplayName || tournament.EventName || null,
					location: tournament.Location?.EventLocation || null,
					type: normalizeEventType(tournament.EventType),
					surface: normalizeSurface(tournament.Surface),
					url: absoluteUrl(tournament.TournamentUrl)
				};

				events.push(event);

				for (const match of tournament.Matches || []) {
					if (match.IsBye || String(match.OpponentId) === '0') {
						continue;
					}

					if (match.PartnerId && String(match.PartnerId) !== '0') {
						continue;
					}

					const opponentId = normalizePlayerId(match.OpponentId);

					if (!isValidPlayerId(opponentId)) {
						continue;
					}

					opponents.add(opponentId);
					opponents.add(normalizePlayerId(playerId));
				}
			}
		}

		return { events, opponents: [...opponents] };
	}

	mergeEvent(baseEvent, nextEvent) {
		return {
			id: baseEvent.id || nextEvent.id,
			date: baseEvent.date || nextEvent.date,
			name: baseEvent.name || nextEvent.name,
			location: baseEvent.location || nextEvent.location,
			type: baseEvent.type || nextEvent.type,
			surface: baseEvent.surface || nextEvent.surface,
			url: baseEvent.url || nextEvent.url
		};
	}

	async discover(seedPlayers) {
		await this.writeLog(`Discovering events and players from activity since ${this.argv.since}...`);

		const queue = seedPlayers.map(player => normalizePlayerId(player.player)).filter(isValidPlayerId);
		const seenPlayers = new Set();
		const discoveredPlayers = new Set(queue);
		const events = new Map();
		let processed = 0;

		while (queue.length > 0) {
			const playerId = queue.shift();

			if (seenPlayers.has(playerId)) {
				continue;
			}

			seenPlayers.add(playerId);
			processed++;

			if (processed === 1 || processed % 50 === 0) {
				await this.writeLog(`Activity ${processed}: ${playerId}`);
			}

			try {
				const raw = await this.client.fetchActivity(playerId);
				const parsed = this.parseActivity(playerId, raw);

				for (const event of parsed.events) {
					const existing = events.get(event.id);
					events.set(event.id, existing ? this.mergeEvent(existing, event) : event);
				}

				for (const opponentId of parsed.opponents) {
					if (!discoveredPlayers.has(opponentId)) {
						discoveredPlayers.add(opponentId);
						queue.push(opponentId);
					}
				}
			} catch (error) {
				await this.logError(`fetching activity for ${playerId}`, error);
			}
		}

		await this.writeLog(`Discovery complete: ${discoveredPlayers.size} players, ${events.size} events.`);

		return {
			players: [...discoveredPlayers],
			events
		};
	}

	determineWinnerTeams(match) {
		const team1 = match?.PlayerTeam1;
		const team2 = match?.PlayerTeam2;
		const winningPlayerId = normalizePlayerId(match?.WinningPlayerId);

		if (isValidPlayerId(winningPlayerId)) {
			if (normalizePlayerId(team1?.PlayerId) === winningPlayerId) {
				return { winner: team1, loser: team2 };
			}

			if (normalizePlayerId(team2?.PlayerId) === winningPlayerId) {
				return { winner: team2, loser: team1 };
			}
		}

		if (String(match?.Winner) === '1') {
			return { winner: team1, loser: team2 };
		}

		if (String(match?.Winner) === '2') {
			return { winner: team2, loser: team1 };
		}

		return null;
	}

	parseArchive(eventId, raw) {
		if (!Array.isArray(raw?.Data) || raw.Data.length === 0) {
			throw new Error(`No event archive found for ${eventId}.`);
		}

		const eventData = raw.Data[0];
		const [eventYear] = String(eventId).split('-');
		const event = {
			id: eventId,
			date: toDateString(eventData.PlayStartDate || eventData.StartDate),
			name: eventData.EventDisplayName || eventData.EventTitle || eventData.EventName || null,
			location: eventData.EventLocation || eventData.EventCity || null,
			type: normalizeEventType(eventData.EventType || eventData.EventLevel),
			surface: normalizeSurface(eventData.Surface),
			url: null
		};

		const matches = new Map();
		const players = new Set();

		for (const match of eventData.Matches || []) {
			if (match.IsDoubles) {
				continue;
			}

			if (!match.MatchId) {
				continue;
			}

			const team1Id = normalizePlayerId(match.PlayerTeam1?.PlayerId);
			const team2Id = normalizePlayerId(match.PlayerTeam2?.PlayerId);

			if (!isValidPlayerId(team1Id) || !isValidPlayerId(team2Id)) {
				continue;
			}

			const teams = this.determineWinnerTeams(match);

			if (!teams?.winner?.PlayerId || !teams?.loser?.PlayerId) {
				continue;
			}

			const winnerId = normalizePlayerId(teams.winner.PlayerId);
			const loserId = normalizePlayerId(teams.loser.PlayerId);

			if (!isValidPlayerId(winnerId) || !isValidPlayerId(loserId)) {
				continue;
			}

			const matchId = `${eventYear}-${event.id.split('-')[1]}-${match.MatchId}`;
			matches.set(matchId, {
				id: matchId,
				event: event.id,
				round: match.Round?.ShortName || null,
				winner: winnerId,
				loser: loserId,
				winner_rank: null,
				loser_rank: null,
				score: normalizeScore(match.ResultString),
				status: deriveMatchStatus(match),
				duration: normalizeDuration(match.MatchTime)
			});

			players.add(winnerId);
			players.add(loserId);
		}

		return {
			event,
			matches,
			players
		};
	}

	async fetchEventArchives(events) {
		await this.writeLog(`Fetching archive data for ${events.size} events...`);

		const importedEvents = new Map();
		const importedMatches = new Map();
		const importedPlayers = new Set();

		let index = 0;
		const orderedEvents = [...events.values()].sort((a, b) => String(a.id).localeCompare(String(b.id)));

		for (const event of orderedEvents) {
			index++;

			if (index === 1 || index % 20 === 0 || index === orderedEvents.length) {
				await this.writeLog(`Event ${index}/${orderedEvents.length}: ${event.id}`);
			}

			try {
				const raw = await this.client.fetchScores(event.id);
				const parsed = this.parseArchive(event.id, raw);
				importedEvents.set(event.id, this.mergeEvent(parsed.event, event));

				for (const [matchId, match] of parsed.matches.entries()) {
					importedMatches.set(matchId, match);
				}

				for (const playerId of parsed.players) {
					importedPlayers.add(playerId);
				}
			} catch (error) {
				await this.logError(`fetching archive for ${event.id}`, error);
				importedEvents.set(event.id, event);
			}
		}

		this.summary.events = importedEvents.size;
		this.summary.matches = importedMatches.size;

		await this.writeLog(`Archive fetching complete: ${importedEvents.size} events, ${importedMatches.size} matches.`);

		return {
			events: importedEvents,
			matches: importedMatches,
			players: importedPlayers
		};
	}

	async saveEvents(events) {
		await this.writeLog(`Saving ${events.size} events...`);

		for (const event of events.values()) {
			await this.db.upsert('events', event);
		}
	}

	async saveMatches(matches) {
		await this.writeLog(`Saving ${matches.size} matches...`);
		let saved = 0;

		for (const match of matches.values()) {
			await this.db.upsert('matches', match);
			saved++;

			if (saved % 1000 === 0) {
				await this.writeLog(`Saved ${saved}/${matches.size} matches...`);
			}
		}
	}

	parsePlayer(playerId, raw) {
		if (!raw || typeof raw !== 'object') {
			return null;
		}

		return {
			id: normalizePlayerId(playerId),
			name: `${raw.FirstName ? `${raw.FirstName} ` : ''}${raw.LastName || ''}`.trim() || null,
			country: raw.NatlId || null,
			age: toInteger(raw.Age),
			birthdate: toDateString(raw.BirthDate),
			pro: toInteger(raw.ProYear),
			active: raw.Active?.Description === 'Active' ? 1 : 0,
			height: toInteger(raw.HeightCm),
			weight: toInteger(raw.WeightKg),
			rank: toInteger(raw.SglRank),
			highest_rank: toInteger(raw.SglHiRank),
			highest_rank_date: toDateString(raw.SglHiRankDate),
			career_wins: toInteger(raw.SglCareerWon),
			career_losses: toInteger(raw.SglCareerLost),
			career_titles: toInteger(raw.SglCareerTitles),
			career_prize: moneyToInteger(raw.CareerPrizeFormatted),
			ytd_wins: toInteger(raw.SglYtdWon),
			ytd_losses: toInteger(raw.SglYtdLost),
			ytd_titles: toInteger(raw.SglYtdTitles),
			ytd_prize: moneyToInteger(raw.SglYtdPrizeFormatted),
			coach: raw.Coach || null,
			url: absoluteUrl(raw.ScRelativeUrlPlayerProfile),
			image_url: absoluteUrl(raw.GladiatorImageUrl)
		};
	}

	async fetchAndSavePlayers(playerIds) {
		const ids = [...playerIds].map(normalizePlayerId).filter(isValidPlayerId).sort();
		this.summary.players = ids.length;
		await this.writeLog(`Fetching ${ids.length} player profiles...`);

		let index = 0;

		for (const playerId of ids) {
			index++;

			if (index === 1 || index % 50 === 0 || index === ids.length) {
				await this.writeLog(`Player ${index}/${ids.length}: ${playerId}`);
			}

			try {
				const raw = await this.client.fetchPlayer(playerId);
				const player = this.parsePlayer(playerId, raw);

				if (player) {
					await this.db.upsert('players', player);
				}
			} catch (error) {
				await this.logError(`fetching player ${playerId}`, error);
			}
		}
	}

	async syncRankingSnapshot(players) {
		await this.writeLog('Updating ranking snapshot...');
		await this.db.query('UPDATE players SET points = NULL');

		for (const player of players) {
			await this.db.query({
				sql: 'UPDATE players SET rank = ?, points = ?, name = COALESCE(name, ?), country = COALESCE(country, ?) WHERE id = ?',
				format: [player.rank, player.points, player.name, player.country, player.player]
			});
		}
	}

	async updateMatchRanks() {
		await this.writeLog('Updating match ranks from players table...');
		await this.db.query(`
			UPDATE matches m
			LEFT JOIN players pw ON pw.id = m.winner
			LEFT JOIN players pl ON pl.id = m.loser
			SET
				m.winner_rank = pw.rank,
				m.loser_rank = pl.rank
		`);
	}

	parseStats(raw) {
		const fields = {
			serve: 'ServeRating',
			return: 'ReturnRating',
			pressure: 'PressureRating'
		};
		const result = {};

		for (const [type, field] of Object.entries(fields)) {
			const leaderboard = raw?.[type]?.Leaderboard;

			if (!Array.isArray(leaderboard) || leaderboard.length === 0) {
				continue;
			}

			const values = leaderboard
				.map(item => ({
					player: normalizePlayerId(item?.PlayerId),
					value: Number(item?.Stats?.[field])
				}))
				.filter(item => isValidPlayerId(item.player) && Number.isFinite(item.value));

			if (values.length === 0) {
				continue;
			}

			const high = Math.max(...values.map(item => item.value));
			const low = Math.min(...values.map(item => item.value));

			for (const item of values) {
				if (!result[item.player]) {
					result[item.player] = { player: item.player };
				}

				result[item.player][type] = high === low ? 100 : Math.round((100 * (item.value - low)) / (high - low));
			}
		}

		return Object.values(result);
	}

	async syncStats() {
		await this.writeLog('Fetching ATP stats leaderboards...');

		try {
			const raw = await this.client.fetchStats();
			const stats = this.parseStats(raw);
			await this.db.query('UPDATE players SET serve_rating = NULL, return_rating = NULL, pressure_rating = NULL');

			for (const player of stats) {
				await this.db.query({
					sql: `
						UPDATE players
						SET serve_rating = ?, return_rating = ?, pressure_rating = ?
						WHERE id = ?
					`,
					format: [player.serve ?? null, player.return ?? null, player.pressure ?? null, player.player]
				});
			}

			await this.writeLog(`Updated ATP stats for ${stats.length} players.`);
		} catch (error) {
			await this.logError('fetching ATP stats', error);
		}
	}

	async updateSurfaceFactors() {
		await this.writeLog('Updating surface factors...');
		await this.db.query('UPDATE players SET clay_factor = NULL, grass_factor = NULL, hard_factor = NULL');

		const activePlayers = await this.db.query('SELECT id FROM players WHERE active = 1');
		const activeSet = new Set(activePlayers.map(player => player.id));

		const rows = await this.db.query(`
			SELECT
				player_id,
				surface,
				SUM(is_win) AS wins,
				COUNT(*) AS matches_played
			FROM (
				SELECT m.winner AS player_id, e.surface AS surface, 1 AS is_win, e.date AS event_date
				FROM matches m
				JOIN events e ON e.id = m.event
				WHERE m.winner IS NOT NULL

				UNION ALL

				SELECT m.loser AS player_id, e.surface AS surface, 0 AS is_win, e.date AS event_date
				FROM matches m
				JOIN events e ON e.id = m.event
				WHERE m.loser IS NOT NULL
			) recent_matches
			WHERE
				event_date >= CURDATE() - INTERVAL 2 YEAR
				AND surface IN ('Clay', 'Grass', 'Hard')
			GROUP BY player_id, surface
		`);

		const factors = new Map();

		for (const row of rows) {
			if (!activeSet.has(row.player_id)) {
				continue;
			}

			if (!factors.has(row.player_id)) {
				factors.set(row.player_id, { Clay: null, Grass: null, Hard: null });
			}

			const matchesPlayed = toInteger(row.matches_played);
			const wins = toInteger(row.wins);
			const value = matchesPlayed > 0 ? Math.round((wins * 100) / matchesPlayed) : null;
			factors.get(row.player_id)[row.surface] = value;
		}

		for (const playerId of activeSet) {
			const value = factors.get(playerId) || { Clay: null, Grass: null, Hard: null };
			await this.db.query({
				sql: 'UPDATE players SET clay_factor = ?, grass_factor = ?, hard_factor = ? WHERE id = ?',
				format: [value.Clay, value.Grass, value.Hard, playerId]
			});
		}
	}

	async updateElo() {
		await this.writeLog('Computing ELO ratings...');

		const rows = await this.db.query(`
			SELECT
				m.id,
				m.winner,
				m.loser,
				m.score,
				e.date AS event_date,
				e.type AS event_type,
				e.surface AS event_surface
			FROM matches m
			JOIN events e ON e.id = m.event
			WHERE e.date IS NOT NULL
			ORDER BY e.date ASC, m.id ASC
		`);

		const maps = {
			total: { ratings: {}, counts: {} },
			Clay: { ratings: {}, counts: {} },
			Grass: { ratings: {}, counts: {} },
			Hard: { ratings: {}, counts: {} }
		};

		const applyMatch = (bucket, match) => {
			const playerA = normalizePlayerId(match.winner);
			const playerB = normalizePlayerId(match.loser);

			if (!isValidPlayerId(playerA) || !isValidPlayerId(playerB)) {
				return;
			}

			const matchesA = bucket.counts[playerA] || 0;
			const matchesB = bucket.counts[playerB] || 0;

			const rankA = bucket.ratings[playerA] ?? 1500;
			const rankB = bucket.ratings[playerB] ?? 1500;

			const expectedA = 1 / (1 + Math.pow(10, (rankB - rankA) / 400));
			const expectedB = 1 / (1 + Math.pow(10, (rankA - rankB) / 400));
			const weight = match.event_type === 'Grand Slam' ? 1.1 : 1;

			bucket.ratings[playerA] = rankA + weight * calculateKFactor(matchesA) * (1 - expectedA);
			bucket.ratings[playerB] = rankB + weight * calculateKFactor(matchesB) * (0 - expectedB);
			bucket.counts[playerA] = matchesA + 1;
			bucket.counts[playerB] = matchesB + 1;
		};

		for (const row of rows) {
			if (getScoreIndex(row.score) == null) {
				continue;
			}

			applyMatch(maps.total, row);

			if (SURFACES.includes(row.event_surface)) {
				applyMatch(maps[row.event_surface], row);
			}
		}

		await this.db.query('UPDATE players SET elo_rank = NULL, elo_rank_clay = NULL, elo_rank_grass = NULL, elo_rank_hard = NULL');

		const playerIds = new Set([
			...Object.keys(maps.total.ratings),
			...Object.keys(maps.Clay.ratings),
			...Object.keys(maps.Grass.ratings),
			...Object.keys(maps.Hard.ratings)
		]);

		for (const playerId of playerIds) {
			await this.db.query({
				sql: `
					UPDATE players
					SET
						elo_rank = ?,
						elo_rank_clay = ?,
						elo_rank_grass = ?,
						elo_rank_hard = ?
					WHERE id = ?
				`,
				format: [
					maps.total.ratings[playerId] == null ? null : Math.round(maps.total.ratings[playerId]),
					maps.Clay.ratings[playerId] == null ? null : Math.round(maps.Clay.ratings[playerId]),
					maps.Grass.ratings[playerId] == null ? null : Math.round(maps.Grass.ratings[playerId]),
					maps.Hard.ratings[playerId] == null ? null : Math.round(maps.Hard.ratings[playerId]),
					playerId
				]
			});
		}

		await this.writeLog(`Updated ELO ratings for ${playerIds.size} players.`);
	}
}

module.exports = new CodexImport();
