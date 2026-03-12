const Fetcher = require('./fetcher');
const jp = require('jsonpath');

class Module extends Fetcher {
	constructor(options) {
		super(options);
		this.response = null;
	}

	async fetch() {
		let url = `https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour`;
		return await this.fetchATP(url);
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

	getGameScore({ tournamentIndex, matchIndex }) {
		const playerGameScore = jp.query(
			this.response,
			`$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}].LiveMatches[${matchIndex}].PlayerTeam.GameScore`
		);
		const opponentGameScore = jp.query(
			this.response,
			`$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}].LiveMatches[${matchIndex}].OpponentTeam.GameScore`
		);

		const player = playerGameScore.length ? playerGameScore[0] : null;
		const opponent = opponentGameScore.length ? opponentGameScore[0] : null;

		if (player == null && opponent == null) {
			return null;
		}

		return `${player ?? '0'}-${opponent ?? '0'}`;
	}

	getServerSide({ tournamentIndex, matchIndex }) {
		const serverTeam = jp.query(
			this.response,
			`$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}].LiveMatches[${matchIndex}].ServerTeam`
		);

		if (!serverTeam.length) {
			return null;
		}

		if (serverTeam[0] === 0) {
			return 'player';
		}

		if (serverTeam[0] === 1) {
			return 'opponent';
		}

		return null;
	}

    getComment({ tournamentIndex, matchIndex }) {
        let comment = jp.query(this.response, `$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}].LiveMatches[${matchIndex}].ExtendedMessage`);
        return comment.length ? comment[0] : null;
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

	async parse(raw) {
		this.response = raw;

		if (!this.response) {
			return [];
		}

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

				if (match.IsDoubles || match.Type != 'singles') {
					continue;
				}

				let score = [];

				for (let setIndex = 0; setIndex < 5; setIndex++) {
					let pA = this.getPlayerSetScore({ tournamentIndex, matchIndex, setIndex });
					let pB = this.getOpponentSetScore({ tournamentIndex, matchIndex, setIndex });

					if (pA && pB && pA.SetScore != null && pB.SetScore != null) {
						let scoreA = pA.SetScore;
						let scoreB = pB.SetScore;

                        let scoreAB = `${scoreA}-${scoreB}`;

						if (pA.TieBreakScore != null) {
							scoreAB += `(${pA.TieBreakScore})`;
						}
						if (pB.TieBreakScore != null) {
							scoreAB += `(${pB.TieBreakScore})`;
						}

						score.push(scoreAB);
					}
				}

				let eventID = `${tournament.EventYear}-${tournament.EventId}`;
				let eventTitle = tournament.EventTitle;
				let game = this.getGameScore({ tournamentIndex, matchIndex });
				let scoreText = score.join(' ');
				let server = this.getServerSide({ tournamentIndex, matchIndex });
                let comment = this.getComment({ tournamentIndex, matchIndex });

				if (match.MatchStatus === 'P' && game) {
					scoreText = scoreText ? `${scoreText} [${game}]` : `[${game}]`;
				}

				let player = this.getPlayer({ tournamentIndex, matchIndex });
				let opponent = this.getOpponent({ tournamentIndex, matchIndex });

				let row = {};
				row.event = eventID;
				row.name = eventTitle;
				row.winner = match.WinningPlayerId;
				row.score = scoreText;
				row.player = player;
				row.opponent = opponent;
				row.server = server;
                row.comment = comment;

				result.push(row);
			}
		}

		return result;
	}
}

module.exports = Module;
