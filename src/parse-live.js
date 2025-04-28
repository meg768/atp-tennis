const { raw } = require('mysql');
const Parser = require('./parser');
const jp = require('jsonpath');

let now = new Date();
let year = now.getFullYear();

class Module extends Parser {
	constructor({ response, options = {} }) {
		super(options);
		this.response = response;
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

		if (player.length == 0) {
			return null;
		}

		player = player[0];

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
			country: player.PlayerCountry
		};
	}

	getOpponent({ tournamentIndex, matchIndex }) {
		// $.Data.LiveMatchesTournamentsOrdered[0].LiveMatches[0].OpponentTeam.Player
		let opponent = jp.query(this.response, `$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}].LiveMatches[${matchIndex}].OpponentTeam.Player`);

		if (opponent.length == 0) {
			return null;
		}

		opponent = opponent[0];

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
			country: opponent.PlayerCountry
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

					if (pA.SetScore != null && pB.SetScore != null) {
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
