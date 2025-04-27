
class Module  {
	constructor(options) {
	}

	parse({response, player}) {
		let events = [];

		for (let activity of response.Activity) {

			for (let tournament of activity.Tournaments) {
				let event = {};


				event.event = `${activity.EventYear}-${tournament.EventId}`;
				event.url = tournament.TournamentUrl ? `http://atptour.com${tournament.TournamentUrl}` : null;
				event.date = new Date(tournament.EventDate);
				event.name = tournament.ScDisplayName;
				event.location = tournament.Location?.EventLocation;
				event.surface = tournament.Surface;
				event.type = tournament.EventType;

				switch (event.type) {
					case 'FU': // Futures
					case 'CH': // Challenger
						continue;
					case 'GS':
						event.type = 'Grand Slam';
						break;
					case 'OL':
						event.type = 'Olympics';
						break;
					case '1000':
						event.type = 'Masters';
						break;
					case '500':
						event.type = 'ATP-500';
						break;
					case '250':
						event.type = 'ATP-250';
						break;
					case 'LVR':
						event.type = 'Rod Laver Cup';
						break;
					case 'DC':
						event.type = 'Davis Cup';
						break;
					case 'WC':
						event.type = 'World Championship';
						break;
					case 'WS':
						event.type = 'World Series';
						break;
					case 'CS':
						event.type = 'Championship Series';
						break;
					case 'S9':
						event.type = 'Super 9';
						break;
					case 'UC':
						event.type = 'United Cup';
						break;
				}

				event.matches = [];

				event.matches = tournament.Matches.map((match) => {
					// Skip if the match is a bye
					if (match.isBye || match.OpponentId == 0) {
						return;
					}

					// Skip doubles matches
					if (match.ParnerId) {
						return;
					}

					if (match.OpponentId.length != 4) {
						throw new Error(`Invalid opponent ID '${match.OpponentId}' in event ${event.event}.`);
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
				event.matches = event.matches.filter((match) => match);

				events.push(event);
			}
		}

		return {
			player: player.toUpperCase(),
			wins: response.Won,
			losses: response.Lost,
			titles: response.Titles,
			prize: response.Prize,
			events: events
		};
	}
}

module.exports = Module;
