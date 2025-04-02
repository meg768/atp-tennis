class Module {
	constructor() {}


	parseMatch(match) {
		let result = {};

		if (match['IsDoubles']) {
			return;
		}
		if (match['IsQualifier']) {
			return;
		}

		let winner = undefined;
		let loser = undefined;

		if (match['WinningPlayerId'] == match['PlayerTeam1']['PlayerId']) {
			winner = match['PlayerTeam1'];
			loser = match['PlayerTeam2'];
		} else {
			winner = match['PlayerTeam2'];
			loser = match['PlayerTeam1'];
		}

		result.winner = {};
		result.loser = {};

		result.round = match['Round']?.['ShortName'];
		result.winner.id = winner['PlayerId'];
		result.loser.id = loser['PlayerId'];
		result.winner.name = winner['PlayerFirstNameFull'] + ' ' + winner['PlayerLastName'];
		result.loser.name = loser['PlayerFirstNameFull'] + ' ' + loser['PlayerLastName'];

		result.winner.country = winner['PlayerCountryCode'];
		result.loser.country = loser['PlayerCountryCode'];

		result.winner.seed = winner['SeedPlayerTeam'] ? parseInt(winner['SeedPlayerTeam']) : undefined;
		result.loser.seed = loser['SeedPlayerTeam'] ? parseInt(loser['SeedPlayerTeam']) : undefined;

		result.duration = match['MatchTime'];
		result.score = match['ResultString'];

		// Replace "Ret'd" with "RET"
		// This is a workaround for the ATP API, which returns "Ret'd" instead of "RET"
		// in some cases
		result.score = result.score.replace("Ret'd", 'RET');
		return result;
	}

	async fetch({eventYear, eventID}) {
		let results = [];

		let url = `https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear=${eventYear}&eventid=${eventID}`;

		console.log('Fetching URL:', url);

		let response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		let data = await response.json();
		data = data['Data'];
		data = data[0];

		console.log('Fetched data:', data);

		if (!data) {
			return;
		}

		let { Matches: matches } = data;

		for (let match of matches) {
			let result = this.parseMatch(match);

			if (result) {
				results.push(result);
			}
		}
		return results;
	}
}

module.exports = Module;
