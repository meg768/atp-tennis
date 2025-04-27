let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');

function getScoreIndex(score) {
	if (typeof score !== 'string' || score.trim() === '') {
		return null;
	}

	let winnerGames = 0;
	let loserGames = 0;
	let setsPlayed = 0;
	let tiebreaks = 0;

	const wasRetired = /Ret'?d|RET/i.test(score); // detect retirement
	const cleanedScore = score.replace(/Ret'?d|RET/gi, '').trim(); // remove RET markers
	const sets = cleanedScore.split(/\s+/);

	if (wasRetired) {
		return null;
	}

	sets.forEach((set) => {
		const hasTiebreak = /\(.*?\)/.test(set);
		if (hasTiebreak) tiebreaks++;

		const cleanedSet = set.replace(/\(.*?\)/g, '');

		if (/^\d{2}$/.test(cleanedSet)) {
			const g1 = parseInt(cleanedSet[0], 10);
			const g2 = parseInt(cleanedSet[1], 10);

			const isLikelyComplete = g1 >= 6 || g2 >= 6;

			if (isLikelyComplete) {
				setsPlayed++;
				if (g1 > g2) {
					winnerGames += g1;
					loserGames += g2;
				} else {
					winnerGames += g2;
					loserGames += g1;
				}
			}
		}
	});

	if (setsPlayed <= 1) {
		return null;
	}
	let x = 1- (winnerGames + loserGames - 6 * setsPlayed) / (7 * setsPlayed);
	//console.log(`${score} : ${x}`);
	return x;
}

function getScoreStatistics(score) {
	if (typeof score !== 'string' || score.trim() === '') {
		return {
			winnerGames: 0,
			loserGames: 0,
			wasRetired: false,
			setsPlayed: 0,
			tiebreaks: 0
		};
	}

	let winnerGames = 0;
	let loserGames = 0;
	let setsPlayed = 0;
	let tiebreaks = 0;

	const wasRetired = /Ret'?d|RET/i.test(score); // detect retirement
	const cleanedScore = score.replace(/Ret'?d|RET/gi, '').trim(); // remove RET markers
	const sets = cleanedScore.split(/\s+/);

	sets.forEach((set) => {
		const hasTiebreak = /\(.*?\)/.test(set);
		if (hasTiebreak) tiebreaks++;

		const cleanedSet = set.replace(/\(.*?\)/g, '');

		if (/^\d{2}$/.test(cleanedSet)) {
			const g1 = parseInt(cleanedSet[0], 10);
			const g2 = parseInt(cleanedSet[1], 10);

			const isLikelyComplete = g1 >= 6 || g2 >= 6;

			if (isLikelyComplete) {
				setsPlayed++;
				if (g1 > g2) {
					winnerGames += g1;
					loserGames += g2;
				} else {
					winnerGames += g2;
					loserGames += g1;
				}
			}
		}
	});

	return {
		winnerGames,
		loserGames,
		wasRetired,
		setsPlayed,
		tiebreaks
	};
}

class Module extends Command {
	constructor() {
		super({ command: 'elo [options]', description: 'Compute ELO ranking' });
		this.mysql = new MySQL();
	}

	arguments(args) {
		args.option('player', {
			alias: 'p',
			describe: 'Player ID',
			type: 'string',
			default: 'R0DG'
		});

		args.option('since', {
			alias: 's',
			describe: 'Since year',
			type: 'number',
			default: '2020'
		});

		args.option('output', {
			alias: 'o',
			describe: 'Output to file',
			type: 'string',
			default: './output/elo.json'
		});

		args.help();
	}

	/*
	https://github.com/sleepomeno/tennis_atp/blob/master/examples/elo.R
	*/
	async computerELO({ surface }) {
		let sql = `SELECT * FROM flatly WHERE event_date >= CURDATE() - INTERVAL 52 WEEK`;
		let format = [];

		if (surface) {
			sql = `SELECT * FROM flatly WHERE event_date >= CURDATE() - INTERVAL 52 WEEK AND event_surface = ?`;
			format = [surface];
		}

		let matches = await this.mysql.query({ sql, format });
		let elo = {};
		let count = {};

		// Count matches and create entries
		for (let match of matches) {
			let { winner_id: playerA, loser_id: playerB } = match;

			let countA = count[playerA] || 0;
			let countB = count[playerB] || 0;

			count[playerA] = countA + 1;
			count[playerB] = countB + 1;
		}

		for (let match of matches) {
			let { winner_id: playerA, loser_id: playerB } = match;

			if (count[playerA] < 10 || count[playerB] < 10) {
				console.log(`Skipping ${match.winner}/${match.loser}`);
				continue;
			}

			let index = getScoreIndex(match.score);

			if (index == null) {
				continue;
			}

			let eloA = elo[playerA] || { rank: 1500, id: playerA, name: match.winner, matches: count[playerA] };
			let eloB = elo[playerB] || { rank: 1500, id: playerB, name: match.loser, matches: count[playerB] };

			let rA = eloA.rank;
			let rB = eloB.rank;

			let eA = 1 / (1 + (10 ^ ((rB - rA) / 400)));
			let eB = 1 / (1 + (10 ^ ((rA - rB) / 400)));

			let sA = 0.5 + index / 2;
			let sB = 0;

			let kA = 250 / ((eloA.matches + 5) ^ 0.4);
			let kB = 250 / ((eloB.matches + 5) ^ 0.4);

			let stats = getScoreStatistics(match.score);
			//kA = 32;
			//kB = 32;
			//console.log(kA, kB);

			let k = match.event_type == 'Grand Slam' ? 1.1 : 1;
			k = k * 4;
			eloA.rank = rA + k * kA * (sA - eA);
			eloB.rank = rB + k * kB * (sB - eB);

			elo[playerA] = eloA;
			elo[playerB] = eloB;
		}

		return elo;
	}

	async updateELO({ surface }) {
		let rankings = await this.computerELO({ surface });
		let field = undefined;

		switch (surface) {
			case undefined: {
				field = 'elo_rank';
				break;
			}

			case 'Grass': {
				field = 'elo_rank_grass';
				break;
			}
			case 'Hard': {
				field = 'elo_rank_hard';
				break;
			}
			case 'Clay': {
				field = 'elo_rank_clay';
				break;
			}
			default: {
				throw new Error(`Unknown surface ${surface}`);
			}
		}

		await this.mysql.query(`UPDATE players SET ${field} = NULL`);

		for (let [id, elo] of Object.entries(rankings)) {
			let sql = `UPDATE players SET ?? = ? WHERE id = ?`;
			let format = [field, elo.rank, elo.id];

			//console.log(`Updating ELO (${surface}) for ${elo.name}...`);

			await this.mysql.query({ sql, format });
		}
	}

	async run(argv) {
		this.argv = argv;

		this.mysql.connect();

		await this.updateELO({});
		
		await this.updateELO({ surface: 'Hard' });
		await this.updateELO({ surface: 'Grass' });
		await this.updateELO({ surface: 'Clay' });
		
		this.mysql.disconnect();
	}
}

module.exports = new Module();
