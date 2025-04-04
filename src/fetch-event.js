const Fetcher = require('./fetcher');

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch({ event }) {

		if (!event) {
			throw new Error('Event ID is required');
		}

		let [eventYear, eventID] = event.split('-');

		if (!eventYear || !eventID) {
			throw Error('A valid event ID must be specified');
		}

		let url = `https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear=${eventYear}&eventid=${eventID}`;
		let response = await this.fetchURL(url);
		let raw = (response = response.Data[0]);

		let result = {};

		result.event = event;
		result.date = raw.PlayStartDate;
		result.name = raw.EventDisplayName;
		result.type = raw.EventType;
		result.level = raw.EventLevel;
		result.matches = [];

		for (let match of raw.Matches) {
			// Skip doubles
			if (match.IsDoubles) {
				continue;
			}

			let item = {};
			item.event = event;
			item.round = match.Round?.ShortName;
			item.score = match.ResultString;
			item.duration = match.MatchTime == '00:00:00' ? null : match.MatchTime;
			item.court = match.CourtName ? match.CourtName : null;
			item.umpire = match.UmpireFirstName && match.UmpireLastName ? `${match.UmpireFirstName} ${match.UmpireLastName}` : null;
			item.sets = match.NumberOfSets;
			item.message = match.Message ? match.Message : null; 

			let winner = undefined;
			let loser = undefined;

			if (match.WinningPlayerId == match.PlayerTeam1.PlayerId) {
				winner = match.PlayerTeam1;
				loser = match.PlayerTeam2;
			} else {
				winner = match.PlayerTeam2;
				loser = match.PlayerTeam1;
			}

			item.round = match.Round?.ShortName;

			item.winner = {};
			item.loser = {};

			item.winner.id = winner.PlayerId;
			item.winner.name = `${winner.PlayerFirstNameFull} ${winner.PlayerLastName}`;
			item.winner.country = winner.PlayerCountryCode;

			item.loser.id = loser.PlayerId;
			item.loser.name = `${loser.PlayerFirstNameFull} ${loser.PlayerLastName}`;
			item.loser.country = loser.PlayerCountryCode;


			result.matches.push(item);
		}

		//result.raw = raw;

		return result;
	}
}

module.exports = Module;
