const Fetcher = require('./fetcher');

function buildMatchId({ event, matchId, round, playerA, playerB, eventType }) {
	let id = `${event}-${matchId}`;
	let players = [playerA, playerB]
		.map(player => String(player || '').trim().toUpperCase())
		.filter(Boolean)
		.sort();

	if (players.length < 2) {
		return `${id}-${String(round || 'UNK').trim().toUpperCase()}`;
	}

	return `${id}-${String(round || 'UNK').trim().toUpperCase()}-${players[0]}-${players[1]}`;
}

class Module extends Fetcher {
	constructor(options) {
		super(options);
		this.event = null;
	}

	parse(raw) {
		const event = this.event;

		function getWinnerTeam(match) {
			if (match.WinningPlayerId == match.PlayerTeam1.PlayerId) {
				return match.PlayerTeam1;
			}

			if (match.WinningPlayerId == match.PlayerTeam2.PlayerId) {
				return match.PlayerTeam2;
			}
		}

		function getLoserTeam(match) {
			if (match.WinningPlayerId == match.PlayerTeam1.PlayerId) {
				return match.PlayerTeam2;
			}

			if (match.WinningPlayerId == match.PlayerTeam2.PlayerId) {
				return match.PlayerTeam1;
			}
		}

		function formatStructuredScore(match) {
			let winner = getWinnerTeam(match);
			let loser = getLoserTeam(match);

			if (!winner || !loser) {
				return null;
			}

			let winnerSets = Array.isArray(winner.Sets) ? winner.Sets.filter(set => set.SetNumber > 0) : [];
			let loserSets = Array.isArray(loser.Sets) ? loser.Sets.filter(set => set.SetNumber > 0) : [];
			let tokens = [];

			for (let i = 0; i < Math.max(winnerSets.length, loserSets.length); i++) {
				let winnerSet = winnerSets[i];
				let loserSet = loserSets[i];

				if (!Number.isInteger(winnerSet?.SetScore) || !Number.isInteger(loserSet?.SetScore)) {
					continue;
				}

				let token = `${winnerSet.SetScore}-${loserSet.SetScore}`;
				let tieBreakScore = Number.isInteger(winnerSet?.TieBreakScore)
					? winnerSet.TieBreakScore
					: Number.isInteger(loserSet?.TieBreakScore)
						? loserSet.TieBreakScore
						: null;

				if (tieBreakScore !== null) {
					token += `(${tieBreakScore})`;
				}

				tokens.push(token);
			}

			return tokens.length > 0 ? tokens.join(' ') : null;
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
			item.id = buildMatchId({
				event,
				matchId: match.MatchId,
				round: match.Round?.ShortName,
				playerA: match.PlayerTeam1.PlayerId,
				playerB: match.PlayerTeam2.PlayerId,
				eventType: eventData.EventType
			});
			item.round = match.Round?.ShortName;
			item.score = formatStructuredScore(match);
			item.duration = formatDuration(match.MatchTime == '00:00:00' ? null : match.MatchTime);
			item.court = match.CourtName ? match.CourtName : null;
			item.umpire = match.UmpireFirstName && match.UmpireLastName ? `${match.UmpireFirstName} ${match.UmpireLastName}` : null;
			item.sets = match.NumberOfSets;
			item.message = match.Message ? match.Message : null;
			item.status = getMatchStatus(match);

			let winner = undefined;
			let loser = undefined;

			winner = getWinnerTeam(match);
			loser = getLoserTeam(match);

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
