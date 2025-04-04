const Fetcher = require('./fetcher');
const ActivityFetcher = require('./fetch-activity');
const RankingsFetcher = require('./fetch-rankings');
const EventFetcher = require('./fetch-event');

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch({ top = 10 }) {
		console.log(`Fetching events for top ${top} players...`);

		let events = [];

		let rankingsFetcher = new RankingsFetcher();
		let activityFetcher = new ActivityFetcher();
		let eventFetcher = new EventFetcher();

		let rankings = await rankingsFetcher.fetch({ top });

		for (let player of rankings.players) {
			let activity = await activityFetcher.fetch({ player: player.id });

			if (!activity || !activity.tournaments) {
				continue;
			}
			for (let tournament of activity.tournaments) {
				if (events.indexOf(tournament.event) === -1) {
					events.push(tournament.event);
				}
			}
		}

		events = events.sort();

		events = events.map(async (event) => {
			return await eventFetcher.fetch({ event });
		});

		return Promise.all(events).then((results) => {
			return results;
		});

	}
}

module.exports = Module;
