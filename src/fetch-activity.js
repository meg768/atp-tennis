const { raw } = require('mysql');
const Fetcher = require('./fetcher');

let now = new Date();
let year = now.getFullYear();

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch({ player, since = year}) {
		let results = [];

		if (!player) {
			throw new Error('Player ID is required');
		}

		let url = `https://www.atptour.com/en/-/www/activity/last/${player}`;
		let response = await this.fetchURL(url);

		if (!response) {
			return null;
		}

		for (let activity of response.Activity) {
			if (since != undefined && activity.EventYear < since) {
				continue;
			}

			for (let tournament of activity.Tournaments) {
				let result = {};

				result.event = `${activity.EventYear}-${tournament.EventId}`;
				result.url = tournament.TournamentUrl ? `http://atptour.com${tournament.TournamentUrl}` : null;
				result.date = new Date(tournament.EventDate);
				result.name = tournament.ScDisplayName;
				result.location = tournament.Location?.EventLocation;
				result.surface = tournament.Surface;
				result.type = tournament.EventType;
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

					if (match.OpponentId.length != 4) {
						throw new Error(`Invalid opponent ID '${match.OpponentId}' in event ${result.event}.`);
					}

					let me = {};
					me.player = player;
					me.rank = tournament.PlayerRank == 0 ? null : tournament.PlayerRank;

					let opponent = {};
					opponent.player = match.OpponentId;
					opponent.rank = match.OpponentRank;

					let entry = {};
					entry.match = `${activity.EventYear}-${tournament.EventId}-${match.MatchId}`;
					entry.round = match.Round?.ShortName;
					entry.opponent = opponent.player;
					entry.winner = {};
					entry.loser = {};

					if (match.WinLoss == 'W') {
						entry.winner = { ...me };
						entry.loser = { ...opponent };
					} else {
						entry.loser = { ...me };
						entry.winner = { ...opponent };
					}
					// Generate my own match ID
					entry.match = `${activity.EventYear}-${tournament.EventId}-${entry.winner.player}-${entry.loser.player}`;

					return entry;
				});

				// Remove undefined matches
				result.matches = result.matches.filter((match) => match);

				if (result.matches.length > 0) {
					results.push(result);
				}
			}
		}

		return {
			player: player.toUpperCase(),
			wins: response.Won,
			losses: response.Lost,
			titles: response.Titles,
			prize: response.Prize,
			events: results,
			raw: response
		};
	}
}

module.exports = Module;
