const assert = require('node:assert/strict');
const test = require('node:test');
const getTaOdds = require('../src/ta-odds');

const row = { time: '2026-10-29 12:00:00', event_name: 'Wien', player_name: 'Alice', opponent_name: 'Bob' };
const identity = { player: 'TEST_A', opponent: 'TEST_B' };
const withoutTa = { ...identity, player_ta: null, opponent_ta: null, event: null };

test('TA uses the verified tournament surface and keeps player/opponent order', async () => {
	const calls = [];
	const mysql = { async query(query) {
		calls.push(query);
		return calls.length === 1 ? [identity] : calls.length === 2 ? [{ id: 'TEST', surface: 'Clay', type: 'ATP-500' }] : [{ player_ta: 1.25, opponent_ta: 3.96 }];
	} };
	assert.deepEqual(await getTaOdds(mysql, row), { ...identity, player_ta: '1.25', opponent_ta: '3.96', event: 'TEST' });
	assert.deepEqual(calls[0].format, ['Alice', 'Alice', 'Bob', 'Bob']);
	assert.deepEqual(calls[1].format, ['Vienna', '2026-10-29', '2026-10-29']);
	assert.deepEqual(calls[2].format, ['TEST_A', 'TEST_B', 'Clay']);
});

test('missing or ambiguous tournament and unsupported surface/format leave TA absent', async () => {
	for (const events of [[], [{ id: 'TEST', surface: 'Hard' }, { id: 'TEST', surface: 'Hard' }],
		[{ id: 'TEST', surface: null, type: 'ATP-500' }], [{ id: 'TEST', surface: 'Carpet', type: 'ATP-500' }],
		[{ id: 'TEST', surface: 'Hard', type: 'Grand Slam' }], [{ id: 'TEST', surface: 'Hard', type: 'Next Gen Finals' }]]) {
		let calls = 0;
		const mysql = { async query() { return ++calls === 1 ? [identity] : events; } };
		assert.deepEqual(await getTaOdds(mysql, row), { ...withoutTa, event: events.length === 1 ? 'TEST' : null });
		assert.equal(calls, 2);
	}
});

test('unavailable or invalid model prices never become zero or retain a previous quote', async () => {
	for (const priced of [{ player_ta: null, opponent_ta: null },
		{ player_ta: 1.2, opponent_ta: null },
		{ player_ta: NaN, opponent_ta: 2 },
		{ player_ta: 0, opponent_ta: 2 }]) {
		let calls = 0;
		const mysql = { async query() { return ++calls === 1 ? [identity] : calls === 2 ? [{ id: 'TEST', surface: 'Hard', type: 'ATP-500' }] : [priced]; } };
		assert.deepEqual(await getTaOdds(mysql, row), { ...withoutTa, event: 'TEST' });
	}
});

test('database failures propagate rather than being reported as missing Elo', async () => {
	const mysql = { async query() { throw new Error('Database unavailable'); } };
	await assert.rejects(getTaOdds(mysql, row), /Database unavailable/);
});


test('partial identities are saved independently and cannot produce TA prices', async () => {
	for (const ids of [{ player: null, opponent: 'TEST_B' },
		{ player: 'TEST_A', opponent: null }, { player: null, opponent: null },
		{ player: 'TEST_A', opponent: 'TEST_A' }]) {
		let calls = 0;
		const mysql = { async query() { return ++calls === 1 ? [ids] : [{ id: 'TEST', surface: 'Hard', type: 'ATP-500' }]; } };
		assert.deepEqual(await getTaOdds(mysql, row), { ...ids, player_ta: null, opponent_ta: null, event: 'TEST' });
		assert.equal(calls, 2);
	}
});
