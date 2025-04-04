const Fetcher = require('./fetcher');

let now = new Date();
let year = now.getFullYear();

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch({ player, since = year - 5}) {
		let results = [];

		if (!player) {
			throw new Error('Player ID is required');
		}

		let url = `https://www.atptour.com/en/-/www/activity/last/${player}`;
		let response = await this.fetchURL(url);

		if (!response) {
			return null
		}

		for (let activity of response.Activity) {

			if (since != undefined && activity.EventYear < since) {
				continue;
			}

			for (let tournament of activity.Tournaments) {
				let result = {};

				result.event = `${activity.EventYear}-${tournament.EventId}`;
				result.url = `http://atptour.com${tournament.TournamentUrl}`;
				result.date = new Date(tournament.EventDate);
				result.name = tournament.ScDisplayName;
				result.location = tournament.Location?.EventLocation;
				result.surface = tournament.Surface;
				result.type = tournament.EventType;
				result.rank = tournament.PlayerRank == 0 ? null : tournament.PlayerRank;
				result.matches = [];

				result.matches = tournament.Matches.map((match) => {

					// Skip if the match is a bye
					if (match.isBye || match.OpponentId == 0) {
						return;
					}

					// Skip doubles matches
					if (match.ParnerId) {
						return;
					}

					let entry = {};
					entry.round = match.Round?.ShortName;
					entry.opponent = {};
					entry.opponent.id = match.OpponentId;
					entry.opponent.name = `${match.OpponentFirstName} ${match.OpponentLastName}`;
					entry.opponent.country = match.OpponentNatlId;
					entry.opponent.rank = match.OpponentRank;



					return entry;
				});

				if (result.matches.length > 0) {
					results.push(result);
				}
			}
		}

		return {
			player:player.toUpperCase(),
			wins:response.Won,
			losses:response.Lost,
			titles:response.Titles,
			prize: response.Prize,
			tournaments: results
		};
	}
}

module.exports = Module;
