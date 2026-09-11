const assert = require('node:assert/strict');
const test = require('node:test');

const { extractMainDraw, filterCurrentGrandSlams, findCurrentAtpTournaments } = require('../src/current-events.js');

test('discovers regular ATP tournaments and Grand Slam forecasts', () => {
	const html = `
		<a href="https://www.tennisabstract.com/current/2026ATPKitzbuhel.html">Kitzbuhel</a>
		<a href="https://www.tennisabstract.com/current/2026USOpenMenForecast.html">US Open</a>
	`;
	const tournaments = findCurrentAtpTournaments(html);

	assert.deepEqual(
		tournaments.map(({ name, sourceType }) => ({ name, sourceType })),
		[
			{ name: 'Kitzbuhel', sourceType: 'atp' },
			{ name: 'US Open', sourceType: 'grand-slam' }
		]
	);
});

test('keeps only the Grand Slam whose local event date is current', () => {
	const tournaments = [
		{ name: 'Kitzbuhel', sourceType: 'atp', date: null },
		{ name: 'Wimbledon', sourceType: 'grand-slam', date: '2026-06-29' },
		{ name: 'US Open', sourceType: 'grand-slam', date: '2026-08-30' }
	];
	const current = filterCurrentGrandSlams(tournaments, new Date('2026-09-11T12:00:00Z'));

	assert.deepEqual(
		current.map(tournament => tournament.name),
		['Kitzbuhel', 'US Open']
	);
});

test('parses the JavaScript projection used by regular ATP events', () => {
	const html = `
		<script>
			var proj32 = '(1)<a href="https://www.tennisabstract.com/cgi-bin/player.cgi?p=100644/Alexander-Zverev">Alexander Zverev</a> (GER)';
		</script>
	`;

	assert.deepEqual(extractMainDraw(html), [{ name: 'Alexander Zverev', country: 'GER', seed: 1, entry: null }]);
});

test('parses the direct table and name-based links used by Grand Slams', () => {
	const html = `
		<table cellpadding=2 cellspacing=0>
			<tr><td>Player</td><td>F</td><td>W</td></tr>
			<tr><td>(1)<a href="https://www.tennisabstract.com/cgi-bin/player.cgi?p=AlexanderZverev">Alexander Zverev</a> (GER)</td></tr>
			<tr><td><a href="https://www.tennisabstract.com/cgi-bin/player.cgi?p=KarenKhachanov">Karen Khachanov</a> (RUS)</td></tr>
		</table>
	`;

	assert.deepEqual(extractMainDraw(html), [
		{ name: 'Alexander Zverev', country: 'GER', seed: 1, entry: null },
		{ name: 'Karen Khachanov', country: 'RUS', seed: null, entry: null }
	]);
});

test('rejects an unrecognized draw format instead of returning no players', () => {
	assert.throws(() => extractMainDraw('<table><tr><td>Player</td></tr></table>'), /The main-draw forecast did not contain any readable players/);
});
