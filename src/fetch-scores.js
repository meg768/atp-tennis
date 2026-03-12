const Fetcher = require('./fetcher');

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	parse(payload, { event } = {}) {
		function getMatchStatus(match) {
			const statusText = [match.MatchStateReasonMessage, match.Message, match.ResultString]
				.filter(Boolean)
				.join(' ')
				.toUpperCase();

			if (/\b(W\/O|WO|WALKOVER)\b/.test(statusText)) {
				return 'Walkover';
			}

			if (/\b(RET|RET'D|RETD|RETIREMENT|DEF|ABD|ABANDONED)\b/.test(statusText)) {
				return 'Aborted';
			}

			if (match.Status === 'F') {
				return 'Completed';
			}

			return 'Unknown';
		}

		if (!event) {
			throw new Error('Event ID is required');
		}

		if (!Array.isArray(payload?.Data) || payload.Data.length === 0) {
			throw new Error(`No information about event ${event} found.`);
		}

		let raw = payload.Data[0];

		let result = {};

		result.event = event;
		result.date = raw.PlayStartDate;
		result.name = raw.EventDisplayName;
		result.type = raw.EventType;
		result.matches = [];

		for (let match of raw.Matches) {
			// Skip doubles
			if (match.IsDoubles) {
				continue;
			}

			// Skip matches with invalid players (like Bye)
			if (match.PlayerTeam1.PlayerId.length != 4 || match.PlayerTeam2.PlayerId.length != 4) {
				continue;
			}

			let item = {};
			item.match = `${event}-${match.MatchId}`;
			item.round = match.Round?.ShortName;
			item.score = match.ResultString;
			item.duration = match.MatchTime == '00:00:00' ? null : match.MatchTime;
			item.court = match.CourtName ? match.CourtName : null;
			item.umpire = match.UmpireFirstName && match.UmpireLastName ? `${match.UmpireFirstName} ${match.UmpireLastName}` : null;
			item.sets = match.NumberOfSets;
			item.message = match.Message ? match.Message : null;
			item.status = getMatchStatus(match);

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

			item.winner.player = winner.PlayerId;
			item.winner.name = `${winner.PlayerFirstNameFull} ${winner.PlayerLastName}`;
			item.winner.country = winner.PlayerCountryCode;

			item.loser.player = loser.PlayerId;
			item.loser.name = `${loser.PlayerFirstNameFull} ${loser.PlayerLastName}`;
			item.loser.country = loser.PlayerCountryCode;

			// Generate my own match id
			item.match = `${event}-${winner.PlayerId}-${loser.PlayerId}`;

			result.matches.push(item);
		}

		return result;
	}

	async fetch({ event } = {}) {
		if (!event) {
			throw new Error('Event ID is required');
		}

		let [eventYear, eventID] = event.split('-');

		if (!eventYear || !eventID) {
			throw Error('A valid event ID must be specified');
		}

		let url = `https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear=${eventYear}&eventid=${eventID}`;
		return await this.fetchATP(url);
	}
}

module.exports = Module;
