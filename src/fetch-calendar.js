const Fetcher = require('./fetcher');

class Module extends Fetcher {
	constructor(options = {}) {
		super(options);
	}

	parse(payload) {
		if (payload == null || typeof payload !== 'object') {
			return { events: [] };
		}

		function normalizeType(value) {
			if (value == null) {
				return null;
			}

			const key = String(value).toUpperCase();
			const map = {
				'1000': 'Masters',
				'500': 'ATP-500',
				'250': 'ATP-250',
				GS: 'Grand Slam',
				UC: 'United Cup',
				DCR: 'Davis Cup',
				LVR: 'Laver Cup',
				WC: 'World Championship'
			};

			return map[key] ?? String(value);
		}

		function extractYear(displayDate) {
			const value = typeof displayDate === 'string' ? displayDate : '';
			const match = value.match(/\b(\d{4})\b/);
			return match ? match[1] : null;
		}

		function formatEventId({ year, id }) {
			if (id == null) {
				return null;
			}

			const normalizedId = String(id);
			return year ? `${year}-${normalizedId}` : normalizedId;
		}

		const dateGroups = Array.isArray(payload?.TournamentDates) ? payload.TournamentDates : [];
		const events = [];

		for (const dateGroup of dateGroups) {
			const year = extractYear(dateGroup?.DisplayDate);
			const items = Array.isArray(dateGroup?.Tournaments) ? dateGroup.Tournaments : [];

			for (const item of items) {
				if (typeof item?.Name !== 'string' || item.Name.length === 0) {
					continue;
				}

				events.push({
					id: formatEventId({ year, id: item.Id }),
					name: item.Name,
					date: item.FormattedDate ?? null,
					location: item.Location ?? null,
					type: normalizeType(item.Type)
				});
			}
		}

		return { events };
	}

	async fetch() {
		const response = await this.fetchATP('https://www.atptour.com/en/-/tournaments/calendar/tour');

		if (!response) {
			return null;
		}

		return response;
	}
}

module.exports = Module;
