let Command = require('../src/command.js');
let Gopher = require('../src/gopher.js');
let readJSON = require('yow/readJSON');
let writeJSON = require('yow/writeJSON').writeJSON;

class Module extends Command {
	constructor() {
		super({ command: 'live [options]', description: 'Fetch live activity' });
		this.mysql = require('../src/mysql.js');
	}

	arguments(args) {
		args.option('output', {
			alias: 'o',
			describe: 'Output to file',
			type: 'string',
			default: './output/live.json'
		});

		args.option('debug', {
			alias: 'd',
			describe: 'Debug mode',
			type: 'boolean',
			default: false
		});

		args.option('input', {
			alias: 'i',
			describe: 'Input file',
			type: 'string',
			default: './input/live.json'
		});

		args.option('poll', {
			alias: 'p',
			describe: 'Poll live matches continuously',
			type: 'boolean',
			default: false
		});

		args.option('interval', {
			alias: 't',
			describe: 'Polling interval in seconds',
			type: 'number',
			default: 30
		});

		args.option('max', {
			alias: 'x',
			describe: 'Maximum polling cycles (0 = unlimited)',
			type: 'number',
			default: 0
		});

		args.option('changes-only', {
			alias: 'c',
			describe: 'Only print output when match data changes while polling',
			type: 'boolean',
			default: true
		});

		args.help();
	}

	async run(argv) {
		this.argv = argv;

		let Fetcher = require('../src/fetch-live.js');
		let fetcher = new Fetcher({});
		const intervalMs = Math.max(1, Number(this.argv.interval) || 30) * 1000;
		const maxCycles = Math.max(0, Number(this.argv.max) || 0);

		function sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		function stamp() {
			return new Date().toISOString();
		}

		function playerText(player) {
			if (!player) {
				return 'Unknown';
			}

			const country = player.country ? ` (${player.country})` : '';
			return `${player.name}${country}`;
		}

		function printMatches(matches, { cycle, changed }) {
			const status = changed ? 'changed' : 'unchanged';
			console.log(`\n[${stamp()}] Live snapshot #${cycle} (${status})`);

			if (!Array.isArray(matches) || matches.length === 0) {
				console.log('No live singles matches right now.');
				return;
			}

			for (let row of matches) {
				const event = row?.name || row?.event || 'Unknown event';
				const left = playerText(row?.player);
				const right = playerText(row?.opponent);
				const score = row?.score && row.score.trim() ? row.score : '-';

				console.log(`${event}: ${left} vs ${right} | ${score}`);
			}
		}

		function signature(matches) {
			if (!Array.isArray(matches)) {
				return '[]';
			}

			return JSON.stringify(
				matches.map(row => ({
					event: row?.event || null,
					player: row?.player?.id || null,
					opponent: row?.opponent?.id || null,
					score: row?.score || ''
				}))
			);
		}

		async function loadMatches() {
			let response = null;

			if (argv.debug && argv.input) {
				response = readJSON(argv.input);
			} else {
				response = await Gopher.fetch('https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour', { retryCount: 1, retryDelay: 1000 });
			}

			fetcher.response = response;
			return await fetcher.parse();
		}

		let previous = null;
		let cycle = 0;

		do {
			cycle++;

			try {
				let json = await loadMatches();
				writeJSON(this.argv.output, json);

				const current = signature(json);
				const changed = previous === null || current !== previous;

				if (!this.argv.poll || !this.argv.changesOnly || changed) {
					printMatches(json, { cycle, changed });
				} else {
					console.log(`[${stamp()}] No changes (${json.length} matches).`);
				}

				previous = current;
			} catch (error) {
				console.error(`[${stamp()}] Failed to fetch live matches: ${error.message}`);
			}

			if (!this.argv.poll) {
				break;
			}

			if (maxCycles > 0 && cycle >= maxCycles) {
				console.log(`[${stamp()}] Polling stopped after ${cycle} cycles.`);
				break;
			}

			await sleep(intervalMs);
		} while (true);
	}
}

module.exports = new Module();
