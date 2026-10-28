const assert = require('node:assert/strict');
const test = require('node:test');

const CollectOdds = require('../src/collect-odds');
const { parsePrematchOdds } = CollectOdds;
const checkedAt = Date.parse('2026-10-28T20:00:00Z');

function offering() {
	return {
		events: [{
			event: { id: 123, state: 'NOT_STARTED', start: '2026-10-29T12:00:00Z', group: 'Wien', homeName: 'Alice', awayName: 'Bob' },
			betOffers: [{
				criterion: { englishLabel: 'Match Odds' },
				outcomes: [
					{ id: 2, participant: 'Bob', status: 'OPEN', odds: 2500 },
					{ id: 3, participant: 'Alice', status: 'OPEN', odds: 1500 }
				]
			}]
		}]
	};
}

function database({ acquired = 1, failWrite = false } = {}) {
	const calls = [];
	return {
		calls,
		async query(sql) {
			calls.push(sql);
			return typeof sql === 'string' && sql.includes('GET_LOCK') ? [{ acquired }] : [];
		},
		async upsert(table, row) {
			calls.push({ table, row });
			if (failWrite) throw new Error('Write failed');
		}
	};
}

test('uses participant names to keep reversed outcomes aligned and stores the quote fields with initially unavailable TA prices', () => {
	assert.deepEqual(parsePrematchOdds(offering(), checkedAt), [{
		id: 123, date: '2026-10-29', tournament: 'Wien',
		player: 'Alice', opponent: 'Bob', player_odds: '1.500', opponent_odds: '2.500',
		player_ta: null, opponent_ta: null
	}]);
});

test('normalizes match dates to UTC without depending on the host timezone', () => {
	const raw = offering();
	raw.events[0].event.start = '2026-10-29T00:30:00+02:00';
	assert.equal(parsePrematchOdds(raw, checkedAt)[0].date, '2026-10-28');
});

test('skips live, unknown, already started and unverifiable-start events', () => {
	for (const change of [
		{ state: 'STARTED' }, { state: 'UNKNOWN' }, { state: undefined },
		{ start: '2026-10-28T20:00:00Z' }, { start: '2026-10-28T19:00:00Z' },
		{ start: null }, { start: 'invalid' }, { start: '2026-10-29T12:00:00' }
	]) {
		const raw = offering();
		Object.assign(raw.events[0].event, change);
		assert.deepEqual(parsePrematchOdds(raw, checkedAt), [], JSON.stringify(change));
	}
});

test('requires two open, valid and unambiguous match-winner outcomes', () => {
	for (const change of ['suspended', 'closed', 'fractional', 'missing', 'duplicate', 'wrong-name', 'set-market']) {
		const raw = offering();
		const offer = raw.events[0].betOffers[0];
		if (change === 'suspended') offer.suspended = true;
		if (change === 'closed') offer.outcomes[0].status = 'SUSPENDED';
		if (change === 'fractional') offer.outcomes[0].odds = 2500.5;
		if (change === 'missing') offer.outcomes.pop();
		if (change === 'duplicate') offer.outcomes[0].id = offer.outcomes[1].id;
		if (change === 'wrong-name') offer.outcomes[0].participant = 'Someone else';
		if (change === 'set-market') offer.criterion.englishLabel = 'Set Winner';
		assert.deepEqual(parsePrematchOdds(raw, checkedAt), [], change);
	}
});

test('rejects malformed source data before writing and accepts a genuinely empty offering', () => {
	assert.deepEqual(parsePrematchOdds({ events: [] }, checkedAt), []);
	for (const raw of [null, {}, { events: {} }, { events: [{}] }]) {
		assert.throws(() => parsePrematchOdds(raw, checkedAt), /invalid ATP offering/);
	}
});

test('fetches fresh primary ATP prices and writes only odds in one transaction', async () => {
	const mysql = database();
	const collect = new CollectOdds({
		mysql, log() {}, now: () => checkedAt,
		fetchImpl: async (url, options) => {
			assert.match(String(url), /listView\/tennis\/atp\/all\/all\/matches.json/);
			assert.equal(url.searchParams.get('lang'), 'sv_SE');
			assert.ok(options.signal instanceof AbortSignal);
			return { ok: true, json: async () => offering() };
		}
	});
	assert.deepEqual(await collect.run(), { fetched: 1, updated: 1 });
	assert.ok(mysql.calls.includes('START TRANSACTION'));
	assert.ok(mysql.calls.includes('COMMIT'));
	assert.deepEqual(mysql.calls.filter(call => call.table).map(call => call.table), ['odds']);
	assert.match(mysql.calls.at(-1), /RELEASE_LOCK/);
});

test('HTTP and invalid JSON failures do not write or reuse an earlier response', async () => {
	for (const response of [
		{ ok: false, status: 503 },
		{ ok: true, json: async () => { throw new SyntaxError('Invalid JSON'); } }
	]) {
		const mysql = database();
		const collect = new CollectOdds({ mysql, log() {}, fetchImpl: async () => response });
		await assert.rejects(collect.run());
		assert.ok(!mysql.calls.includes('START TRANSACTION'));
		assert.equal(mysql.calls.filter(call => call.table).length, 0);
		assert.match(mysql.calls.at(-1), /RELEASE_LOCK/);
	}
});

test('a failed write rolls back and releases the collection lock', async () => {
	const mysql = database({ failWrite: true });
	const collect = new CollectOdds({ mysql, log() {}, now: () => checkedAt, fetchImpl: async () => ({ ok: true, json: async () => offering() }) });
	await assert.rejects(collect.run(), /Write failed/);
	assert.ok(mysql.calls.includes('ROLLBACK'));
	assert.ok(!mysql.calls.includes('COMMIT'));
	assert.match(mysql.calls.at(-1), /RELEASE_LOCK/);
});

test('an overlapping Node collector skips before fetching or writing', async () => {
	const mysql = database({ acquired: 0 });
	const collect = new CollectOdds({ mysql, log() {}, fetchImpl: async () => { throw new Error('Must not fetch'); } });
	assert.deepEqual(await collect.run(), { skipped: true, updated: 0 });
	assert.equal(mysql.calls.length, 1);
});

test('an empty offering preserves all previously stored matches', async () => {
	const mysql = database();
	const collect = new CollectOdds({ mysql, log() {}, fetchImpl: async () => ({ ok: true, json: async () => ({ events: [] }) }) });
	assert.deepEqual(await collect.run(), { fetched: 0, updated: 0 });
	assert.ok(!mysql.calls.includes('START TRANSACTION'));
	assert.equal(mysql.calls.filter(call => call.table).length, 0);
});

test('CLI reports a failed collection, disconnects and sets a nonzero exit code', async t => {
	const mysql = require('../src/mysql');
	const command = require('../commands/odds');
	const previousExitCode = process.exitCode;
	t.after(() => { process.exitCode = previousExitCode; });
	const disconnect = t.mock.method(mysql, 'disconnect', async () => {});
	t.mock.method(mysql, 'connect', async () => { throw new Error('Connection failed'); });
	t.mock.method(console, 'error', () => {});
	await command.run();
	assert.equal(process.exitCode, 1);
	assert.equal(disconnect.mock.calls.length, 1);
});

test('MariaDB preserves one row per event, ignores live quotes and rolls back failed batches', { skip: process.env.ATP_ODDS_INTEGRATION !== '1' }, async () => {
	require('dotenv').config();
	const fs = require('node:fs');
	const path = require('node:path');
	const mysql = require('../src/mysql');
	await mysql.connect();
	try {
		await mysql.query("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION'");
		const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
		const start = schema.indexOf('CREATE TABLE `odds` (');
		assert.ok(start >= 0);
		const end = schema.indexOf('\n/*!40101 SET character_set_client', start);
		await mysql.query(schema.slice(start, end).replace('CREATE TABLE', 'CREATE TEMPORARY TABLE'));
		for (const table of ['players', 'events']) {
			const tableStart = schema.indexOf('CREATE TABLE `'+table+'` (');
			const tableEnd = schema.indexOf('\n/*!40101 SET character_set_client', tableStart);
			await mysql.query(schema.slice(tableStart, tableEnd).replace('CREATE TABLE', 'CREATE TEMPORARY TABLE'));
		}
		await mysql.query("INSERT INTO events(id,date,name,type,surface) VALUES('TEST','2026-10-26','Vienna','ATP-500','Hard')");
		await mysql.query("INSERT INTO players(id,name,country,rank,active,elo_rank,elo_rank_hard,elo_rank_clay,elo_rank_grass) VALUES('TEST_A','Alice','SE',1,1,1600,1600,1800,1600),('TEST_B','Bob','SE',2,1,1600,1800,1600,1600)");
		let raw = offering();
		const collect = new CollectOdds({ mysql, log() {}, now: () => checkedAt, fetchImpl: async () => ({ ok: true, json: async () => raw }) });
		await collect.run();
		raw.events[0].betOffers[0].outcomes[0].odds = 3000;
		await collect.run();
		let rows = await mysql.query('SELECT * FROM odds');
		assert.equal(rows.length, 1);
		assert.equal(Number(rows[0].id), 123);
		assert.equal(Number(rows[0].opponent_odds), 3);
		assert.equal(Number(rows[0].player_ta), 3.96);
		assert.equal(Number(rows[0].opponent_ta), 1.25);
		await mysql.query("UPDATE players SET elo_rank_hard=IF(id='TEST_A',1800,1600)");
		raw.events[0].event.state = 'STARTED';
		raw.events[0].betOffers[0].outcomes[0].odds = 9000;
		await collect.run();
		assert.equal(Number((await mysql.query('SELECT opponent_odds FROM odds'))[0].opponent_odds), 3);
		assert.equal(Number((await mysql.query('SELECT player_ta FROM odds'))[0].player_ta), 3.96);
		raw = offering();
		raw.events[0].betOffers[0].outcomes[0].odds = 4000;
		const bad = structuredClone(raw.events[0]);
		bad.event.id = 456;
		bad.event.group = 'X'.repeat(256);
		raw.events.push(bad);
		await assert.rejects(collect.run(), /Data too long/);
		rows = await mysql.query('SELECT * FROM odds');
		assert.equal(rows.length, 1);
		assert.equal(Number(rows[0].opponent_odds), 3);
		assert.equal(Number(rows[0].player_ta), 3.96);
		// A new valid bookmaker observation must not retain an older TA quote.
		await mysql.query("UPDATE players SET elo_rank_hard=NULL WHERE id='TEST_B'");
		raw = offering();
		raw.events[0].betOffers[0].outcomes[0].odds = 4100;
		await collect.run();
		rows = await mysql.query('SELECT * FROM odds');
		assert.equal(Number(rows[0].opponent_odds), 4.1);
		assert.equal(rows[0].player_ta, null);
		assert.equal(rows[0].opponent_ta, null);
	} finally {
		await mysql.disconnect();
	}
});
