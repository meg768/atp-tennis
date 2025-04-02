class Module {
	constructor() {}

	async fetchPlayerActivity(url) {
		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Error fetching ATP Tour data:', error);
			return null;
		}
	}

	async importEx({ playerID }) {
		let opponents = await this.import({ playerID });

		if (opponents) {
			for (let opponentID of opponents) {
				await this.import({ playerID: opponentID });
			}
		}
	}

	async fetch(playerID) {
		let results = {};

		function translateType(type) {
			switch (type) {
				case 'AS':
					return undefined;
				case 'Q':
					return undefined;
				case 'PZ':
					return undefined;
				case 'CH':
					return undefined;
				case 'FU':
					return undefined;
				case 'DC':
					return 'Davis Cup';
				case 'GS':
					return 'Grand Slam';
				case '1000':
					return 'Masters';
				case '500':
					return 'ATP-500';
				case 'WS':
					return 'ATP-250';
				case '250':
					return 'ATP-250';
				case 'F':
					return 'ATP Finals';
				case 'OL':
					return 'Olympics';
				default:
					return type;
			}
		}

		console.log(`Fetching player ${playerID}...`);

		let url = `https://www.atptour.com/en/-/www/activity/last/${playerID}`;
		let data = await this.fetchPlayerActivity(url);

		if (data === null) {
			return;
		}

		let { Activity: activities } = data;
		let opponents = [];

		for (let activity of activities) {
			let { EventYear: eventYear, Tournaments: tournaments } = activity;

			for (let tournament of tournaments) {
				let id = `${eventYear}-${tournament['EventId']}`;

				let { EventDate: date, Matches: matches, ScDisplayName: name, Surface: surface, EventType: type } = tournament;

				type = translateType(type);

				if (type === undefined) {
					continue;
				}
				await this.mysql.upsert('events', { id, name, surface, date, type });

				for (let match of matches) {
					let { OpponentId: opponentID } = match;

					if (opponents.indexOf(opponentID) < 0) {
						opponents.push(opponentID);
					}
				}
			}
		}

		return opponents;
	}
}

module.exports = Module;
