const Fetcher = require('./fetcher');
const ActivityFetcher = require('./fetch-activity');
const RankingsFetcher = require('./fetch-rankings');
const EventFetcher = require('./fetch-event');

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	async fetch({}) {
		let events = [];

		let rankingsFetcher = new RankingsFetcher();
		let activityFetcher = new ActivityFetcher();
		let eventFetcher = new EventFetcher();

		let rankings = await rankingsFetcher.fetch({});

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

		let results = [];

		for (let event of events) {
			let result = await eventFetcher.fetch({ event: event });

			if (!result) {
				continue;
			}

			if (result.type == 'CH' || result.type == 'FU' || result.level == 'ITF') {
				continue;
			}

			results.push(result);
		}
		return results;
	}
}

module.exports = Module;
