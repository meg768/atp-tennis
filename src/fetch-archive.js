const Fetcher = require('./fetcher');

class Module extends Fetcher {
	constructor(options) {
		super(options);
		this.event = null;
	}

	parse(raw) {
		const event = this.event;

		function formatScore(rawScore) {
			if (!rawScore || typeof rawScore !== 'string') {
				return rawScore;
			}

			let text = rawScore.trim();

			text = text.replace(/\b(RET(?:['']?D)?|W\/O|WO|WALKOVER)\b\.?$/i, '').trim();

			if (!text) {
				return null;
			}

			const tokens = text.split(/\s+/);
			return tokens.map(formatSetToken).join(' ');
		}

		function formatSetToken(token) {
			if (token.includes('-')) {
				return token;
			}

			const tieBreakMatch = token.match(/^(\d+)\((\d+)\)$/);
			if (tieBreakMatch) {
				const games = parseCompactGames(tieBreakMatch[1]);

				if (!games) {
					return token;
				}

				return `${games[0]}-${games[1]}(${tieBreakMatch[2]})`;
			}

			const games = parseCompactGames(token);

			if (!games) {
				return token;
			}

			return `${games[0]}-${games[1]}`;
		}

		function parseCompactGames(token) {
			if (!/^\d+$/.test(token)) {
				return null;
			}

			if (token.length === 2) {
				return [token[0], token[1]];
			}

			if (token.length === 3) {
				return [token[0], token.slice(1)];
			}

			if (token.length === 4) {
				return [token.slice(0, 2), token.slice(2)];
			}

			return null;
		}

		function formatDuration(duration) {
			if (!duration) {
				return null;
			}

			const parts = duration.split(':');

			if (parts.length === 3) {
				return `${parts[0]}:${parts[1]}`;
			}

			if (parts.length === 2) {
				return duration;
			}

			return null;
		}

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

		if (!Array.isArray(raw?.Data) || raw.Data.length === 0) {
			throw new Error(`No information about event ${event} found.`);
		}

		let eventData = raw.Data[0];

		let result = {};

		result.id = event;
		result.date = eventData.PlayStartDate;
		result.name = eventData.EventDisplayName;
		result.type = eventData.EventType;
		result.matches = [];

		for (let match of eventData.Matches) {
			// Skip doubles
			if (match.IsDoubles) {
				continue;
			}

			// Skip matches with invalid players (like Bye)
			if (match.PlayerTeam1.PlayerId.length != 4 || match.PlayerTeam2.PlayerId.length != 4) {
				continue;
			}

			let item = {};
			item.id = `${event}-${match.MatchId}`;
			item.round = match.Round?.ShortName;
			item.score = formatScore(match.ResultString);
			item.duration = formatDuration(match.MatchTime == '00:00:00' ? null : match.MatchTime);
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

			result.matches.push(item);
		}

		return result;
	}

	async fetch({ event } = {}) {
		if (!event) {
			throw new Error('Event ID is required');
		}

		this.event = event;

		let [eventYear, eventID] = event.split('-');

		if (!eventYear || !eventID) {
			throw Error('A valid event ID must be specified');
		}

		let url = `https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear=${eventYear}&eventid=${eventID}`;
		return await this.fetchATP(url);
	}
}

module.exports = Module;
