
export default async function () {
	const url = 'https://www.atptour.com/-/tournaments/explore/1000'; // not a JSON endpoint!

	function parseStartDate(formattedDate) {
		const match = formattedDate.match(/^(\d{1,2})\s*-\s*(\d{1,2})\s*(\w+),\s*(\d{4})/) || formattedDate.match(/^(\d{1,2})\s*(\w+)\s*-\s*(\d{1,2})\s*(\w+),\s*(\d{4})/);

		let day, monthName, year;
		if (match?.length === 5) [, day, , monthName, year] = match;
		else if (match?.length === 6) [, day, monthName, , , year] = match;
		else return null;

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

	const response = await fetch(url);

	if (!response.headers.get('content-type')?.includes('application/json')) {
		throw new Error('Expected JSON but got something else (probably HTML)');
	}

	// This will throw unless response is actual JSON (see earlier warning)
	const data = await response.json();

	return data.TournamentsList.map(t => ({
		name: t.Name,
		title: t.Title,
		location: t.Location,
		country: t.CountryCode,
		type: t.Type,
		date: parseStartDate(t.FormattedDate)
	}));
}
