const Fetcher = require('./fetcher');

let now = new Date();
let year = now.getFullYear();

class Module extends Fetcher {
	constructor(options) {
		super(options);
		this.player = null;
		this.since = year;
	}

	parse(raw) {
		let events = [];
		const player = this.player;
		const since = this.since;

		if (!player) {
			throw new Error('Player ID is required');
		}

		if (!raw || !Array.isArray(raw.Activity)) {
			return null;
		}

		for (let activity of raw.Activity) {
			if (since != undefined && activity.EventYear < since) {
				continue;
			}

			for (let tournament of activity.Tournaments) {
				let event = {};


				event.id = `${activity.EventYear}-${tournament.EventId}`;
				event.url = tournament.TournamentUrl ? `https://www.atptour.com${tournament.TournamentUrl}` : null;
				event.date = new Date(tournament.EventDate);
				event.name = tournament.ScDisplayName;
				event.location = tournament.Location?.EventLocation;
				event.surface = tournament.Surface;
				event.type = tournament.EventType;

				switch (event.type) {
                    // Skip some event types that are not relevant
                    case 'ATPC':
                        continue;
	                case 'FU':
	                    continue;
	                case 'CH':
	                    event.type = 'Challenger';
	                    break;
	                case 'Q':
	                    continue;
	                case 'PZ':
	                    event.type = 'Prize Money';
	                    break
                    case 'GC':  
                        event.type = 'Grand Championship';
                        break;
                    case 'GP':
                        event.type = 'Grand Prix';
                        break;
                    case 'WT':
                        event.type = 'World Tour';
                        break;
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
					case 'UC':
						event.type = 'United Cup';
						break;
					case 'XXI':
						event.type = 'Next Gen Finals';
						break;
				}

				event.matches = [];

				event.matches = tournament.Matches.map((match) => {
					// Skip if the match is a bye
					if (match.isBye || match.OpponentId == 0) {
						return;
					}

					// Skip doubles matches
					if (match.PartnerId) {
						return;
					}

					if (match.OpponentId.length != 4) {
						throw new Error(`Invalid opponent ID '${match.OpponentId}' in event ${event.id}.`);
					}

					let me = {};
					me.player = player;
					me.rank = tournament.PlayerRank == 0 ? null : tournament.PlayerRank;

					let opponent = {};
					opponent.player = match.OpponentId;
					opponent.rank = match.OpponentRank;

					let entry = {};
					entry.id = `${activity.EventYear}-${tournament.EventId}-${match.MatchId}`;
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

					return entry;
				});

				// Remove undefined matches
				event.matches = event.matches.filter((match) => match);

				events.push(event);
			}
		}

		return {
			player: player.toUpperCase(),
			wins: raw.Won,
			losses: raw.Lost,
			titles: raw.Titles,
			prize: raw.Prize,
			events: events
		};
	}

	async fetch({ player, since } = {}) {
		if (!player) {
			throw new Error('Player ID is required');
		}

		this.player = String(player).toUpperCase();
		const parsedSince = Number(since);
		this.since = since != undefined && Number.isFinite(parsedSince) ? parsedSince : year;

		let url = `https://www.atptour.com/en/-/www/activity/last/${this.player}`;
		return await this.fetchATP(url);
	}
}

module.exports = Module;
