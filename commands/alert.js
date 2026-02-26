let Command = require('../src/command.js');
let Gopher = require('../src/gopher.js');
let readJSON = require('yow/readJSON');

class Module extends Command {
	constructor() {
		super({ command: 'alert [options]', description: 'Monitor ATP live scores and notify on score changes' });
	}

	arguments(args) {
		args.option('url', {
			alias: 'u',
			describe: 'Live endpoint to monitor',
			type: 'string',
			default: 'https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour'
		});

		args.option('interval', {
			alias: 'i',
			describe: 'Polling interval in seconds',
			type: 'number',
			default: 30
		});

		args.option('cooldown', {
			describe: 'Minimum seconds between notifications for the same match',
			type: 'number',
			default: 0
		});

		args.option('max-checks', {
			describe: 'Maximum checks before exit (0 = unlimited)',
			type: 'number',
			default: 0
		});

		args.option('once', {
			describe: 'Exit after first score-change notification',
			type: 'boolean',
			default: false
		});

		args.option('debug', {
			alias: 'd',
			describe: 'Read data from local input file instead of ATP endpoint',
			type: 'boolean',
			default: false
		});

		args.option('input', {
			alias: 'f',
			describe: 'Input JSON file used when --debug is enabled',
			type: 'string',
			default: './input/live.json'
		});

		args.help();
	}

	async run(argv) {
		this.argv = argv;

		const intervalMs = Math.max(1, Number(this.argv.interval) || 30) * 1000;
		const cooldownMs = Math.max(0, Number(this.argv.cooldown) || 0) * 1000;
		const maxChecks = Math.max(0, Number(this.argv.maxChecks) || 0);

		let checkCount = 0;
		let previousScoreByMatch = new Map();
		let lastNotifiedAt = new Map();
		let unusualNotified = new Set();

		function sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		function playerFromTeam(team) {
			const player = team?.Player || {};
			const firstName = player.PlayerFirstName || '';
			const lastName = player.PlayerLastName || '';

			return {
				id: player.PlayerId || null,
				name: `${firstName} ${lastName}`.trim() || 'Unknown',
				country: player.PlayerCountry || null
			};
		}

		function toInt(value) {
			const n = Number(value);
			return Number.isInteger(n) ? n : null;
		}

		function playerLabel(player) {
			const id = player?.id || 'N/A';
			return `${player?.name || 'Unknown'} (${id})`;
		}

		function setList(match) {
			const leftSets = Array.isArray(match?.PlayerTeam?.SetScores) ? match.PlayerTeam.SetScores : [];
			const rightSets = Array.isArray(match?.OpponentTeam?.SetScores) ? match.OpponentTeam.SetScores : [];
			const maxLen = Math.max(leftSets.length, rightSets.length);
			let sets = [];

			for (let index = 0; index < maxLen; index++) {
				const left = leftSets[index];
				const right = rightSets[index];
				const a = left?.SetScore ?? null;
				const b = right?.SetScore ?? null;
				const ta = left?.TieBreakScore ?? null;
				const tb = right?.TieBreakScore ?? null;

				if (a === null && b === null) {
					continue;
				}

				sets.push({ a, b, ta, tb });
			}

			return sets;
		}

		function formatSetScore(sets) {
			if (!Array.isArray(sets) || sets.length === 0) {
				return '-';
			}

			return sets
				.map(set => {
					const a = set.a ?? '?';
					const b = set.b ?? '?';
					const ta = set.ta != null ? `(${set.ta})` : '';
					const tb = set.tb != null ? `(${set.tb})` : '';
					return `${a}${ta}-${b}${tb}`;
				})
				.join(' ');
		}

		function formatGameScore(match) {
			const left = match?.PlayerTeam?.GameScore;
			const right = match?.OpponentTeam?.GameScore;

			if (!left && !right) {
				return '';
			}

			return `${left || '0'}-${right || '0'}`;
		}

		function formatFullScore(match) {
			const sets = formatSetScore(setList(match));
			const games = formatGameScore(match);

			if (!games) {
				return sets;
			}

			return `${sets} (${games})`;
		}

		function completedSetWins(sets) {
			let left = 0;
			let right = 0;

			function isCompletedSet(a, b) {
				if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) {
					return false;
				}

				const hi = Math.max(a, b);
				const lo = Math.min(a, b);

				return (hi >= 6 && hi - lo >= 2) || (hi === 7 && lo === 6);
			}

			for (let set of sets) {
				if (!isCompletedSet(set.a, set.b)) {
					continue;
				}

				if (set.a > set.b) {
					left += 1;
				} else {
					right += 1;
				}
			}

			return { left, right };
		}

		function detectUnusual(match) {
			let reasons = [];
			const sets = Array.isArray(match.sets) ? match.sets : [];

			for (let set of sets) {
				if ((set.a === 6 && set.b === 0) || (set.b === 6 && set.a === 0)) {
					reasons.push({ code: 'bagel', text: 'Bagel set (6-0)' });
					break;
				}
			}

			for (let set of sets) {
				if ((set.a === 6 && set.b === 1) || (set.b === 6 && set.a === 1)) {
					reasons.push({ code: 'breadstick', text: 'Breadstick set (6-1)' });
					break;
				}
			}

			for (let set of sets) {
				const ta = Number(set.ta);
				const tb = Number(set.tb);
				if ((Number.isFinite(ta) && ta >= 8) || (Number.isFinite(tb) && tb >= 8)) {
					reasons.push({ code: 'long_tiebreak', text: 'Long tiebreak' });
					break;
				}
			}

			const noteText = `${match.reason || ''} ${match.extended || ''}`.toLowerCase();
			if (/(retired|retirement|walkover|w\/o|default|injury|medical)/.test(noteText)) {
				reasons.push({ code: 'ret_or_wo', text: 'Retirement / walkover / medical event' });
			}

			const seedA = match.player?.seed;
			const seedB = match.opponent?.seed;
			const wins = completedSetWins(sets);
			const leader = wins.left > wins.right ? 'left' : wins.right > wins.left ? 'right' : null;

			let favored = null;
			if (seedA && seedB && seedA !== seedB) {
				favored = seedA < seedB ? 'left' : 'right';
			} else if (seedA && !seedB) {
				favored = 'left';
			} else if (!seedA && seedB) {
				favored = 'right';
			}

			if (favored && leader && favored !== leader) {
				reasons.push({ code: 'seed_upset', text: 'Seed upset in progress' });
			}

			return reasons;
		}

		function shouldNotify(matchId, currentTime) {
			const last = lastNotifiedAt.get(matchId) || 0;

			if (currentTime - last < cooldownMs) {
				return false;
			}

			lastNotifiedAt.set(matchId, currentTime);
			return true;
		}

		function toMatches(payload) {
			const tournaments = Array.isArray(payload?.Data?.LiveMatchesTournamentsOrdered) ? payload.Data.LiveMatchesTournamentsOrdered : [];
			let matches = [];

			for (let tournament of tournaments) {
				const liveMatches = Array.isArray(tournament?.LiveMatches) ? tournament.LiveMatches : [];

					for (let match of liveMatches) {
						if (match?.Type !== 'singles' || match?.IsDoubles) {
							continue;
						}

					const player = playerFromTeam(match.PlayerTeam);
					const opponent = playerFromTeam(match.OpponentTeam);
					const event = tournament?.EventTitle || `${tournament?.EventYear || ''}-${tournament?.EventId || ''}`.replace(/^-|-$/g, '');

						matches.push({
							id: `${tournament?.EventYear || 'x'}-${tournament?.EventId || 'x'}-${match?.MatchId || 'x'}`,
							event: event || 'Unknown event',
							round: match?.RoundName || 'Unknown round',
							status: match?.MatchStatus || 'Unknown',
							player,
							opponent,
							score: formatFullScore(match),
							sets: setList(match),
							reason: match?.MatchStateReasonMessage || '',
							extended: match?.ExtendedMessage || ''
						});
					}
				}

			return matches;
		}

		async function fetchPayload() {
			if (argv.debug) {
				return readJSON(argv.input);
			}

			return await Gopher.fetch(argv.url, { retryCount: 1, retryDelay: 1000 });
		}

		while (true) {
			checkCount += 1;

			try {
				const payload = await fetchPayload();
				const matches = toMatches(payload);
				const currentTime = Date.now();
				let notifications = 0;

					for (let match of matches) {
						const previousScore = previousScoreByMatch.get(match.id) || null;

						if (previousScore !== null && previousScore !== match.score && shouldNotify(match.id, currentTime)) {
							console.log(`\u0007${playerLabel(match.player)} vs ${playerLabel(match.opponent)} | ${match.score}`);
							notifications += 1;
						}

						const unusualReasons = detectUnusual(match);
						for (let reason of unusualReasons) {
							const key = `${match.id}|${reason.code}`;
							if (unusualNotified.has(key)) {
								continue;
							}

							unusualNotified.add(key);
							console.log(`\u0007UNUSUAL: ${reason.text}`);
							console.log(`${playerLabel(match.player)} vs ${playerLabel(match.opponent)} | ${match.score}`);
							notifications += 1;
						}

						previousScoreByMatch.set(match.id, match.score);
					}

				if (this.argv.once && notifications > 0) {
					return;
				}
			} catch (error) {
				console.error(`Poll failed: ${error.message}`);
			}

			if (maxChecks > 0 && checkCount >= maxChecks) {
				return;
			}

			await sleep(intervalMs);
		}
	}
}

module.exports = new Module();
