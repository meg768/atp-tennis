const Fetcher = require('./fetcher');

const UPCOMING_EVENTS_URL = 'https://www.atptour.com/-/tournaments/explore/1000';

class Module extends Fetcher {
	constructor(options) {
		super(options);
	}

	parseStartDate(formattedDate) {
		if (!formattedDate || typeof formattedDate !== 'string') {
			return null;
		}

		const match =
			formattedDate.match(/^(\d{1,2})\s*-\s*(\d{1,2})\s*(\w+),\s*(\d{4})/) ||
			formattedDate.match(/^(\d{1,2})\s*(\w+)\s*-\s*(\d{1,2})\s*(\w+),\s*(\d{4})/);

		let day;
		let monthName;
		let year;

		if (match?.length === 5) {
			[, day, , monthName, year] = match;
		} else if (match?.length === 6) {
			[, day, monthName, , , year] = match;
		} else {
			return null;
		}

		const months = {
			January: '01',
			February: '02',
			March: '03',
			April: '04',
			May: '05',
			June: '06',
			July: '07',
			August: '08',
			September: '09',
			October: '10',
			November: '11',
			December: '12'
		};

		return `${year}-${months[monthName] || '01'}-${day.padStart(2, '0')}`;
	}

	parse(raw) {
		if (!raw || !Array.isArray(raw.TournamentsList)) {
			return [];
		}

		return raw.TournamentsList.map(tournament => ({
			name: tournament.Name,
			title: tournament.Title,
			location: tournament.Location,
			country: tournament.CountryCode,
			type: tournament.Type,
			date: this.parseStartDate(tournament.FormattedDate)
		}));
	}

	async fetch() {
		const response = await fetch(UPCOMING_EVENTS_URL);
		const contentType = response.headers.get('content-type') || '';

		if (!contentType.includes('application/json')) {
			throw new Error('Expected JSON but got something else (probably HTML)');
		}

		return await response.json();
	}
}

module.exports = Module;
