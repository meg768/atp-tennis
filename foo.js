
async function fetchScheduledMatches() {
	try {
		const url = 'https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour';

		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
				Accept: 'application/json, text/plain, */*',
				Origin: 'https://www.atptour.com',
				Referer: 'https://www.atptour.com/en/'
			}
		});

		if (!response.ok) {
			throw new Error(`ATP API call failed with status ${response.status}`);
		}

		const data = await response.json();

		// Extract scheduled matches
		const scheduledMatches = [];

		if (data.liveEvents && Array.isArray(data.liveEvents)) {
			data.liveEvents.forEach((event) => {
				if (event.Matches && Array.isArray(event.Matches)) {
					event.Matches.forEach((match) => {
						if (match.Status === 'Scheduled') {
							scheduledMatches.push({
								tournament: event.EventName,
								court: match.Court,
								round: match.Round,
								playerOne: match.PlayerOne?.Name || '',
								playerTwo: match.PlayerTwo?.Name || '',
								startTimeUTC: match.StartTime || null
							});
						}
					});
				}
			});
		}

		console.log('🎾 Scheduled Matches:', JSON.stringify(scheduledMatches, null, 2));
		return scheduledMatches;
	} catch (error) {
		console.error('🔴 Error fetching scheduled matches:', error.message);
		throw error;
	}
}

// Run directly
if (import.meta.url === `file://${process.argv[1]}`) {
	fetchScheduledMatches();
}

export default fetchScheduledMatches;
