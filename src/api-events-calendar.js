const Api = require('./api');

class ApiEventsCalendar extends Api {
	parse(raw) {
		if (raw == null || typeof raw !== 'object') {
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

		function normalizeSurface(value) {
			if (value == null) {
				return null;
			}

			const text = String(value).trim();
			return text === '' ? null : text;
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

		function extractStartDate(value) {
			if (typeof value !== 'string' || value.trim() === '') {
				return null;
			}

			const text = value.trim();
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

			function toIsoDate({ day, month, year }) {
				const monthNumber = months[month];

				if (!monthNumber) {
					return null;
				}

				return `${year}-${monthNumber}-${String(day).padStart(2, '0')}`;
			}

			let match = text.match(/^(\d{1,2})\s*-\s*\d{1,2}\s+([A-Za-z]+),\s*(\d{4})$/);

			if (match) {
				return toIsoDate({ day: match[1], month: match[2], year: match[3] });
			}

			match = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s*-\s*\d{1,2}\s+[A-Za-z]+,\s*(\d{4})$/);

			if (match) {
				return toIsoDate({ day: match[1], month: match[2], year: match[3] });
			}

			match = text.match(/^(\d{1,2})\s+([A-Za-z]+),\s*(\d{4})$/);

			if (match) {
				return toIsoDate({ day: match[1], month: match[2], year: match[3] });
			}

			return null;
		}

		const dateGroups = Array.isArray(raw?.TournamentDates) ? raw.TournamentDates : [];
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
					date: extractStartDate(item.FormattedDate),
					location: item.Location ?? null,
					type: normalizeType(item.Type),
					surface: normalizeSurface(item.Surface)
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

module.exports = ApiEventsCalendar;
