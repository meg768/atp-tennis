let Command = require('../src/command.js');
let ScoreParser = require('../src/score-parser.js');

const EXAMPLE_SCORES = [
	'7-5 7-6(6)',
	'6-3 7-6(4)',
	'6-4 6-2',
	'6-7(5) 6-2 6-3',
	'911 64 86',
	'67(4) 63 62 RET',
	'W/O'
];

class Module extends Command {
	constructor() {
		super({ command: 'score-parser [scores..]', description: 'Run the ScoreParser test bench' });
	}

	arguments(args) {
		args.positional('scores', {
			describe: 'One or more score strings to parse',
			type: 'string',
			array: true
		});

		args.option('score', {
			alias: 's',
			describe: 'A single score string to parse',
			type: 'string'
		});

		args.option('examples', {
			alias: 'e',
			describe: 'Run the built-in example cases',
			type: 'boolean',
			default: false
		});

		args.option('json', {
			alias: 'j',
			describe: 'Print parsed results as JSON',
			type: 'boolean',
			default: false
		});

		args.help();
	}

	run(argv) {
		const scores = argv.score
			? [argv.score]
			: argv.scores && argv.scores.length > 0
				? argv.scores
				: argv.examples
					? EXAMPLE_SCORES
					: EXAMPLE_SCORES;
		const results = scores.map(score => this.inspectScore(score));

		if (argv.json) {
			console.log(JSON.stringify(results, null, 2));
			return;
		}

		for (const result of results) {
			console.log(`score: ${result.score}`);
			console.log(`normalized: ${result.normalized}`);
			console.log(`sets: ${result.sets}`);
			console.log(`tiebreaks: ${result.tiebreaks}`);
			console.log(`games: ${result.games}`);
			console.log(`currentGame: ${result.currentGame}`);
			console.log(`error: ${result.error}`);
			console.log('');
		}
	}

	inspectScore(score) {
		try {
			const parser = new ScoreParser(score);
			const currentGame = parser.getGameScore();

			return {
				score,
				normalized: parser.score,
				sets: parser.getSetsPlayed(),
				tiebreaks: parser.getTieBreaksPlayed(),
				games: parser.getGamesPlayed(),
				currentGame: currentGame ? currentGame.join('-') : null,
				error: null
			};
		} catch (error) {
			return {
				score,
				normalized: null,
				sets: null,
				tiebreaks: null,
				games: null,
				currentGame: null,
				error: error.message
			};
		}
	}
}

module.exports = new Module();
