const assert = require('node:assert/strict');
const test = require('node:test');
const getTaOdds = require('../src/ta-odds');

const row = { date: '2026-10-29', tournament: 'Wien', player: 'Alice', opponent: 'Bob' };

test('TA uses the verified tournament surface and keeps player/opponent order', async () => {
	const calls = [];
	const mysql = { async query(query) {
		calls.push(query);
		return calls.length === 1 ? [{ surface: 'Clay', type: 'ATP-500' }] : [{ player_ta: 1.25, opponent_ta: 3.96 }];
	} };
	assert.deepEqual(await getTaOdds(mysql, row), { player_ta: '1.25', opponent_ta: '3.96' });
	assert.deepEqual(calls[0].format, ['Vienna', row.date, row.date]);
	assert.deepEqual(calls[1].format, ['Alice', 'Alice', 'Bob', 'Bob', 'Clay']);
});

test('missing or ambiguous tournament and unsupported surface/format leave TA absent', async () => {
	for (const events of [[], [{ surface: 'Hard' }, { surface: 'Hard' }],
		[{ surface: null, type: 'ATP-500' }], [{ surface: 'Carpet', type: 'ATP-500' }],
		[{ surface: 'Hard', type: 'Grand Slam' }], [{ surface: 'Hard', type: 'Next Gen Finals' }]]) {
		let calls = 0;
		const mysql = { async query() { calls++; return events; } };
		assert.deepEqual(await getTaOdds(mysql, row), { player_ta: null, opponent_ta: null });
		assert.equal(calls, 1);
	}
});

test('unavailable or invalid model prices never become zero or retain a previous quote', async () => {
	for (const priced of [{ player_ta: null, opponent_ta: null },
		{ player_ta: 1.2, opponent_ta: null },
		{ player_ta: NaN, opponent_ta: 2 },
		{ player_ta: 0, opponent_ta: 2 }]) {
		let calls = 0;
		const mysql = { async query() { return ++calls === 1 ? [{ surface: 'Hard', type: 'ATP-500' }] : [priced]; } };
		assert.deepEqual(await getTaOdds(mysql, row), { player_ta: null, opponent_ta: null });
	}
});

test('database failures propagate rather than being reported as missing Elo', async () => {
	const mysql = { async query() { throw new Error('Database unavailable'); } };
	await assert.rejects(getTaOdds(mysql, row), /Database unavailable/);
});
