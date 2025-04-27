const { raw } = require('mysql');
const Fetcher = require('./fetcher');
const jp = require('jsonpath');

let now = new Date();
let year = now.getFullYear();

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch({ raw}) {
		let results = [];


		let url = `https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour`;
		let xxx = `https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour`;
		let response = await this.fetchURL(url);

		if (!response) {
			return null;
		}
		if (raw != undefined && (raw == '' || raw != 0)) {
			return response;
		}

		let result = [];

		for (let tournamentIndex = 0;; tournamentIndex++) {
			let tournament = jp.query(response, `$.Data.LiveMatchesTournamentsOrdered[${tournamentIndex}]`);

			if (tournament.length == 0) {
				break;
			}

			tournament = tournament[0];

			for (let matchIndex = 0;; matchIndex++) {
				let match = jp.query(tournament, `$.LiveMatches[${matchIndex}]`);

				if (match.length == 0) {
					break;
				}

				match = match[0];

				let eventID = `${tournament.EventYear}-${tournament.EventId}`;
				let eventTitle = tournament.EventTitle;
				let player = jp.query(match, `$.PlayerTeam.Player`)[0];
				let opponent = jp.query(match, `$.OpponentTeam.Player`)[0];

				let row = {};
				row.event = eventID;
				row.title = eventTitle;
				row.player = {};
				row.opponent = {};
				
				row.player.id = player.PlayerId;
				row.player.name = `${player.PlayerFirstName} ${player.PlayerLastName}`;

				row.opponent.id = opponent.PlayerId;
				row.opponent.name = `${opponent.PlayerFirstName} ${opponent.PlayerLastName}`;

				result.push(row);
				
			}
		}

		return result;
	}
}

module.exports = Module;
