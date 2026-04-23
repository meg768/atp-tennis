let cache = null;
let cacheAt = 0;
const cacheTime = 30 * 1000;

class Oddset {
	constructor(options = {}) {
		this.url = options.url ?? 'https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/listView/tennis/atp/all/all/matches.json';
	}

	async fetch() {
		if (cache && Date.now() - cacheAt < cacheTime) {
			return cache;
		}

		let buildUrl = () => {
			const url = new URL(this.url);
			url.searchParams.set('channel_id', '1');
			url.searchParams.set('client_id', '200');
			url.searchParams.set('lang', 'sv_SE');
			url.searchParams.set('market', 'SE');
			url.searchParams.set('useCombined', 'true');
			url.searchParams.set('useCombinedLive', 'true');
			return url;
		};
		const response = await fetch(buildUrl(), {
			headers: {
				accept: 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status} ${response.statusText}`);
		}

		cache = await response.json();
		cacheAt = Date.now();
		return cache;
	}

	async getMatches() {
		let filter = json => {
			return json.events.map(item => {
				let matchOdds = item.betOffers.find(offer => offer.criterion.label === 'Matchodds');
				let homeSets = item.liveData?.statistics?.sets?.home ?? [];
				let awaySets = item.liveData?.statistics?.sets?.away ?? [];
				let sets = homeSets.map((home, index) => `${home}-${awaySets[index]}`);
				let game = `${item.liveData?.score?.home}-${item.liveData?.score?.away}`;
				let score = `${sets.join(' ')} [${game}]`;

				let match = {
					start: item.event.start,
					tournament: item.event.group,
					playerA: { name: item.event.homeName, odds: matchOdds?.outcomes?.[0]?.odds / 1000 },
					playerB: { name: item.event.awayName, odds: matchOdds?.outcomes?.[1]?.odds / 1000 },
					state: item.event.state == 'STARTED' ? 'live' : 'upcoming',
					score: item.liveData ? score : null,
					serve: item.liveData ? (item.liveData?.statistics?.sets?.homeServe ? 'player' : 'opponent') : null
				};

				return match;
			});
		};

		return filter(await this.fetch());
	}

	async getLiveMatches() {
		return (await this.getMatches()).filter(match => match.state === 'live');
	}

	async getUpcomingMatches() {
		return (await this.getMatches()).filter(match => match.state === 'upcoming');
	}
}

module.exports = Oddset;
