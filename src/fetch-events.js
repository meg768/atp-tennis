const Fetcher = require('./fetcher');
const ActivityFetcher = require('./fetch-activity');
const RankingsFetcher = require('./fetch-rankings');
const EventFetcher = require('./fetch-event');

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch({top}) {
		let events = [];

		let rankingsFetcher = new RankingsFetcher();
		let activityFetcher = new ActivityFetcher();
		let eventFetcher = new EventFetcher();

		let rankings = await rankingsFetcher.fetch({top});

		for (let player of rankings.players) {
			let activity = await activityFetcher.fetch({ player: player.player });

			if (!activity || !activity.events) {
				continue;
			}
			for (let event of activity.events) {
				if (events.indexOf(event.event) === -1) {
					events.push(event.event);
				}
			}
		}

		events = events.sort();

		let results = [];

		for (let event of events) {
			let result = await eventFetcher.fetch({ event: event });

			if (!result) {
				continue;
			}

			results.push(result);
		}
		return results;
	}
}

module.exports = Module;
