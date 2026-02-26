const Fetcher = require('./fetcher');
const jp = require('jsonpath');


class Module extends Fetcher {
	constructor(options) {
		super(options);
		this.response = null;
	}

	async fetch() {
		let url = `https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour`;
		let response = await this.fetchATP(url);

		if (!response) {
			return null;
		}
		this.response = response;
		return await this.parse();
	}

	getTournament({ tournamentIndex }) {
		// $.Data.LiveMatchesTournamentsOrdered[0]
		let result = jp.query(this.response, `$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}]`);

		if (result.length == 0) {
			return null;
		}

		result = result[0];

		return result;
	}

	getMatch({ tournamentIndex, matchIndex }) {
		// $.Data.LiveMatchesTournamentsOrdered[0].LiveMatches[0]
		let result = jp.query(this.response, `$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}].LiveMatches[${matchIndex}]`);

		if (result.length == 0) {
			return null;
		}

		result = result[0];

		return result;
	}

	getPlayerSetScore({ tournamentIndex, matchIndex, setIndex }) {
		// $.Data.LiveMatchesTournamentsOrdered[0].LiveMatches[0].PlayerTeam.SetScores[0]
		let setScore = jp.query(this.response, `$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}].LiveMatches[${matchIndex}].PlayerTeam.SetScores[${setIndex}]`);

		if (setScore.length == 0) {
			return null;
		}

		setScore = setScore[0];

		let sample = {
			SetNumber: 1,
			SetScore: 6,
			TieBreakScore: null,
			Stats: null
		};

		return setScore;
	}

	getOpponentSetScore({ tournamentIndex, matchIndex, setIndex }) {
		// $.Data.LiveMatchesTournamentsOrdered[0].LiveMatches[0].OpponentTeam.SetScores[0]
		let setScore = jp.query(this.response, `$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}].LiveMatches[${matchIndex}].OpponentTeam.SetScores[${setIndex}]`);

		if (setScore.length == 0) {
			return null;
		}

		setScore = setScore[0];

		let sample = {
			SetNumber: 1,
			SetScore: 6,
			TieBreakScore: null,
			Stats: null
		};

		return setScore;
	}

	getPlayer({ tournamentIndex, matchIndex }) {
		// $.Data.LiveMatchesTournamentsOrdered[0].LiveMatches[0].PlayerTeam.Player
		let player = jp.query(this.response, `$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}].LiveMatches[${matchIndex}].PlayerTeam.Player`);
		let seed = jp.query(this.response, `$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}].LiveMatches[${matchIndex}].PlayerTeam.Seed`);

		if (player.length == 0) {
			return null;
		}

		player = player[0];
		seed = seed.length ? seed[0] : null;

		let sample = {
			PlayerId: 'D0CO',
			PlayerCountry: 'GBR',
			PlayerCountryName: null,
			PlayerFirstName: 'Jack',
			PlayerLastName: 'Draper'
		};

		return {
			id: player.PlayerId,
			name: `${player.PlayerFirstName} ${player.PlayerLastName}`,
			country: player.PlayerCountry,
			seed: seed
		};
	}

	getOpponent({ tournamentIndex, matchIndex }) {
		// $.Data.LiveMatchesTournamentsOrdered[0].LiveMatches[0].OpponentTeam.Player
		let opponent = jp.query(this.response, `$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}].LiveMatches[${matchIndex}].OpponentTeam.Player`);
		let seed = jp.query(this.response, `$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}].LiveMatches[${matchIndex}].OpponentTeam.Seed`);

		if (opponent.length == 0) {
			return null;
		}

		opponent = opponent[0];
		seed = seed.length ? seed[0] : null;

		let sample = {
			PlayerId: 'D0CO',
			PlayerCountry: 'GBR',
			PlayerCountryName: null,
			PlayerFirstName: 'Jack',
			PlayerLastName: 'Draper'
		};

		return {
			id: opponent.PlayerId,
			name: `${opponent.PlayerFirstName} ${opponent.PlayerLastName}`,
			country: opponent.PlayerCountry,
			seed: seed
		};
	}

	async parse() {
		let result = [];

		for (let tournamentIndex = 0; ; tournamentIndex++) {
			let tournament = this.getTournament({ tournamentIndex });

			if (!tournament) {
				break;
			}

			for (let matchIndex = 0; ; matchIndex++) {
				let match = this.getMatch({ tournamentIndex, matchIndex });
				if (!match) {
					break;
				}

				if (match.isDoubles || match.Type != 'singles') {
					continue;
				}

				let score = [];

				for (let setIndex = 0; setIndex < 5; setIndex++) {
					let pA = this.getPlayerSetScore({ tournamentIndex, matchIndex, setIndex });
					let pB = this.getOpponentSetScore({ tournamentIndex, matchIndex, setIndex });

						if (pA && pB && pA.SetScore != null && pB.SetScore != null) {
						let scoreA = pA.SetScore;
						if (pA.TieBreakScore != null) {
							scoreA += `(${pA.TieBreakScore})`;
						}
						let scoreB = pB.SetScore;
						if (pB.TieBreakScore != null) {
							scoreB += `(${pB.TieBreakScore})`;
						}

						score.push(`${scoreA}${scoreB}`);
					}
				}

				let eventID = `${tournament.EventYear}-${tournament.EventId}`;
				let eventTitle = tournament.EventTitle;

				let player = this.getPlayer({ tournamentIndex, matchIndex });
				let opponent = this.getOpponent({ tournamentIndex, matchIndex });

				let row = {};
				row.event = eventID;
				row.name = eventTitle;
				row.score = score.join(' ');
				row.player = player;
				row.opponent = opponent;

				result.push(row);
			}
		}

		return result;
	}
}

module.exports = Module;
