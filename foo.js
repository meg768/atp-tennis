#!/usr/bin/env node
/*

EventID 96: Tournament: Paris, Level: Tour, Type: OL
EventID 301: Tournament: Auckland, Level: Tour, Type: 250
EventID 308: Tournament: Munich, Level: Tour, Type: 250
EventID 311: Tournament: London, Level: Tour, Type: 500
EventID 314: Tournament: Gstaad, Level: Tour, Type: 250
EventID 315: Tournament: Newport, Level: Tour, Type: 250
EventID 316: Tournament: Bastad, Level: Tour, Type: 250
EventID 319: Tournament: Kitzbuhel, Level: Tour, Type: 250
EventID 321: Tournament: Stuttgart, Level: Tour, Type: 250
EventID 322: Tournament: Geneva, Level: Tour, Type: 250
EventID 328: Tournament: Basel, Level: Tour, Type: 500
EventID 329: Tournament: Tokyo, Level: Tour, Type: 500
EventID 336: Tournament: Hong Kong, Level: Tour, Type: 250
EventID 337: Tournament: Vienna, Level: Tour, Type: 500
EventID 339: Tournament: Brisbane, Level: Tour, Type: 250
EventID 341: Tournament: Metz, Level: Tour, Type: 250
EventID 352: Tournament: Paris, Level: Tour, Type: 1000
EventID 360: Tournament: Marrakech, Level: Tour, Type: 250
EventID 375: Tournament: Montpellier, Level: Tour, Type: 250
EventID 403: Tournament: Miami, Level: Tour, Type: 1000
EventID 404: Tournament: Indian Wells, Level: Tour, Type: 1000
EventID 407: Tournament: Rotterdam, Level: Tour, Type: 500
EventID 410: Tournament: Monte-Carlo, Level: Tour, Type: 1000
EventID 414: Tournament: Hamburg, Level: Tour, Type: 500
EventID 416: Tournament: Rome, Level: Tour, Type: 1000
EventID 418: Tournament: Washington, Level: Tour, Type: 500
EventID 421: Tournament: Montreal, Level: Tour, Type: 1000
EventID 422: Tournament: Cincinnati, Level: Tour, Type: 1000
EventID 424: Tournament: Dallas, Level: Tour, Type: 250
EventID 425: Tournament: Barcelona, Level: Tour, Type: 500
EventID 429: Tournament: Stockholm, Level: Tour, Type: 250
EventID 439: Tournament: Umag, Level: Tour, Type: 250
EventID 440: Tournament: 's-Hertogenbosch, Level: Tour, Type: 250
EventID 451: Tournament: Doha, Level: Tour, Type: 250
EventID 495: Tournament: Dubai, Level: Tour, Type: 500
EventID 496: Tournament: Marseille, Level: Tour, Type: 250
EventID 499: Tournament: Delray Beach, Level: Tour, Type: 250
EventID 500: Tournament: Halle, Level: Tour, Type: 500
EventID 506: Tournament: Buenos Aires, Level: Tour, Type: 250
EventID 520: Tournament: Roland Garros, Level: GS, Type: GS
EventID 540: Tournament: Wimbledon, Level: GS, Type: GS
EventID 560: Tournament: US Open, Level: GS, Type: GS
EventID 580: Tournament: Australian Open, Level: GS, Type: GS
EventID 605: Tournament: Nitto ATP Finals, Level: Tour, Type: WC
EventID 717: Tournament: Houston, Level: Tour, Type: 250
EventID 741: Tournament: Eastbourne, Level: Tour, Type: 250
EventID 747: Tournament: Beijing, Level: Tour, Type: 500
EventID 807: Tournament: Acapulco, Level: Tour, Type: 500
EventID 901: Tournament: Malaga, Level: DC, Type: DC

*/

require('dotenv').config();

let MySQL = require('./src/mysql.js');

class App {
	constructor() {
		this.mysql = new MySQL();
	}

	log() {
		console.log.apply(console, arguments);
	}

	async fetchEvent(year, eventID) {
		try {
			const response = await fetch(`https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear=${year}&eventid=${eventID}`);

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			let data = await response.json();
			data = data['Data'];
			data = data[0];
			return data;
		} catch (error) {
			console.error('Error fetching ATP Tour data:', error);
			return null;
		}
	}

	parseMatch(match) {
		let result = {};

		if (match['IsDoubles']) {
			return;
		}
		if (match['IsQualifier']) {
			return;
		}

		let winnerID = match['WinningPlayerId'];

		
		let winnerTeam = match['Winner'] == '2' ? 'PlayerTeam1' : 'PlayerTeam2';
		let loserTeam = match['Winner'] == '2' ? 'PlayerTeam2' : 'PlayerTeam1';

		result.round = match['Round']?.['ShortName'];
		result.winner = match[winnerTeam]['PlayerFirstNameFull'] + ' ' + match[winnerTeam]['PlayerLastName'];
		result.loser = match[loserTeam]['PlayerFirstNameFull'] + ' ' + match[loserTeam]['PlayerLastName'];

		result.watpid = match[winnerTeam]['PlayerId'];
		result.latpid = match[loserTeam]['PlayerId'];

		/*
	result.wseed = match[winnerTeam]['SeedPlayerTeam'] ? parseInt(match[winnerTeam]['SeedPlayerTeam']) : undefined;
	result.lseed = match[loserTeam]['SeedPlayerTeam'] ? parseInt(match[loserTeam]['SeedPlayerTeam']) : undefined;
*/
		result.wioc = match[winnerTeam]['PlayerCountryCode'];
		result.lioc = match[loserTeam]['PlayerCountryCode'];
		result.duration = match['MatchTime'];
		result.score = match['ResultString'];

		return result;
	}

	async importYear(year) {
		for (let eventID = 1; eventID <= 999; eventID++) {
			this.log(`Trying EventID ${eventID}`);
			let data = await this.fetchEvent(year, eventID);

			if (!data) {
				continue;
			}

			let { EventDisplayName: tournament, PlayStartDate: date, EventLevel: level, EventType: type, Matches: matches } = data;

			if (level == 'CH' || level == 'ITF') {
				continue;
			}

			date = new Date(date).toLocaleDateString('sv-SE');


			for (let match of matches) {
				let matchResult = this.parseMatch(match);
				if (matchResult) {
					matchResult = { date, tournament, level, type, ...matchResult };
					console.log(matchResult);
					await this.mysql.upsert('matches', matchResult);

					let winner = {};
					winner.name = matchResult.winner;
					winner.country = matchResult.wioc;
					winner.atpid = matchResult.watpid;
					await this.mysql.upsert('players', winner);

					let loser = {};
					loser.name = matchResult.loser;
					loser.country = matchResult.lioc;
					loser.atpid = matchResult.latpid;
					await this.mysql.upsert('players', loser);
				}
			}
		}
	}

	async run() {
		this.mysql.connect();

		await this.importYear(2025);

		this.mysql.disconnect();
	}
}

let app = new App();
app.run();
