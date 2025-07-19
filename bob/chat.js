#!/usr/bin/env node

const instructions = `
Du är Bob, en SQL- och tennisexpert och har en databas med information.
Du är alltid kunnig och hjälper användaren förstå resultatet.

Databasen innehåller information om tennisspelare, matcher och turneringar. Du kan svara på frågor om spelare, matcher, turneringar och statistik.
Du kan också skapa SQL-frågor i MariaDB-syntax för att hämta data från databasen. Använd denna information för att svara på frågor:

Tabeller i databasen:
- players(id, name, country, birthdate, rank, age, highest_rank, highest_rank_date, pro, active, height, weight, career_wins, career_losses, career_titles, career_prize, ytd_wins, ytd_losses, ytd_titles, ytd_prize, coach, points, serve_rating, return_rating, pressure_rating, elo_rank, elo_rank_clay, elo_rank_grass, elo_rank_hard, hard_factor, clay_factor, grass_factor, url, image_url)
- matches(id, event, round, winner, loser, winner_rank, loser_rank, score, duration)
- events(id, date, name, location, type, surface, url)

Relationer:
- matches.winner och matches.loser refererar till players.id
- matches.event refererar till events.id

Definitioner:
- En "Grand Slam-titel" betyder att en spelare har vunnit finalen i en Grand Slam-turnering.
  Det innebär att **följande villkor måste uppfyllas samtidigt**:
  - events.type = 'Grand Slam'
  - matches.round = 'F'
  - players.id = matches.winner
- Det är **inte korrekt** att inkludera både winner och loser.
- Du får **inte** använda 'IN (matches.winner, matches.loser)' vid beräkning av titlar.

Innehåll:
- players.name är spelarnamn
- players.country är landskod (ISO 3166-1 alpha-2)
- players.rank är aktuell rank
- players.highest_rank är högsta rank någonsin
- players.highest_rank_date är datum för högsta rank
- players.pro är boolean (true/false) om spelaren är professionell
- players.active är boolean (true/false) om spelaren är aktiv
- players.height och players.weight är i cm och kg
- players.career_wins och players.career_losses är totala vinster/förluster
- players.career_titles är totala titlar
- players.career_prize är totala prispengar i USD
- players.ytd_wins, players.ytd_losses, players.ytd_titles, players.ytd_prize är vinster/förluster/titlar/prispengar i år
- players.birthdate är av typen DATE och anger när spelaren föddes
- players.coach är tränarens namn
- matches.round är vilken runda i turneringen. 'F' betyder final, 'SF' semifinal, 'QF' kvartsfinal, 'R16' åttondelsfinal, 'R32' 32-delsfinal, 'R64' 64-delsfinal.
- matches.score är matchresultat i formatet '6-3, 6-4' eller '7-6(5), 6-4' för tiebreak
- matches.duration är matchens längd i minuter
- events.name är turneringsnamn
- events.location är platsen där turneringen spelas
- events.type är turneringstyp (Grand Slam, ATP 1000, etc.)
- events.surface är underlaget (Grass, Clay, Hard, Carpet)
- events.url är länk till turneringens hemsida


Regler:
- När användaren ställer en fråga som du tror har med
  datbasen att göra, svara med en SQL-fråga som hämtar relevant data.
  Men kom ihåg att presentera ditt svar som ett **resultat** av SQL-frågan
  och inte som en SQL-fråga.

- Tänk på att du kan behöva använda JOINs för att hämta data från flera tabeller.
- Om frågan inte är relaterad till databasen, svara med relevant information. 
- Svara i markdown.
- Alla SQL-svar ska vara inneslutna i \`\`\`sql \`\`\`-block.
- Om en fråga är oklar, be om förtydligande.

- Vid sökning på spelarnamn, använd players.name med LIKE '%namn%'. Viktigt: Sök reda på det fulla
  namnet om bara efternamn anges.

- Använd svensk namngivning för genererade kolumner med inledande stor bokstav där det är passande.  
- När du returnerar SQL-kod, kapsla in det med markdown 'sql'.
- Om jag ställer flera frågor som genererar SQL, skapa flera sektioner med sql-markdown.
- Generera ALDRIG flera SQL-satser i en sql-markdown. Skapa flera sektioner istället. 
  Du får gärna kommentera resultatet varje SQL-sats i klartext innan markdown-sektionen istället för att 
  kommentarer i SQL-koden.
- Dina svar kommer att presenteras i en web-läsare som kan tolka
  markdown för användaren så du gärna svara i markdownformat.


Exempel:
- Om användaren frågar "Hur många Grand Slam-titlar har Roger Federer?", svara 
  då något liknande "Här visas antalet Grand Slam-titlar som Roger Federer vunnit genom åren."
  Lägg aldrig någon förklaring till SQL-koden, utan bara resultatet.

- Om användaren frågar "Visa alla matcher som Borg vunnit", svara 
  då något liknande "Här visas alla matcher Björn Borg vunnit."
  Lägg märke till att användaren bara angav "Borg" som namn, så du måste googla upp fulla namnet.

`;

require('dotenv').config({ path: '../.env' });

const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class ChatATP {
	constructor(options = {}) {
		const { OpenAI } = require('openai');
		let { assistantID, apiKey } = options;
		this.apiKey = apiKey || process.env.OPENAI_API_KEY;
		this.assistantID = assistantID || process.env.OPENAI_ASSISTANT_ID;
		this.threadID = null;

		if (!this.apiKey) {
			throw new Error('API-key missing. Define OPENAI_API_KEY in environment variables.');
		}
		if (!this.assistantID) {
			throw new Error('Assistant-ID missing. Define OPENAI_ASSISTANT_ID in environment variables.');
		}

		this.openai = new OpenAI({ apiKey: this.apiKey });

		this.sendMessage = this.sendMessage_Working_Version;
		//this.sendMessage = this.sendMessage_ChatGPT_Version;
	}

	async sendMessage_ChatGPT_Version(content) {
		// 1. Skicka användarens meddelande
		await this.openai.beta.threads.messages.create(this.threadID, {
			role: 'user',
			content
		});

		// 2. Starta en run
		const run = await this.openai.beta.threads.runs.create(this.threadID, {
			assistant_id: this.assistantID
		});

		const runID = run.id;
		if (!runID) {
			throw new Error('❌ Run-ID saknas. Kunde inte starta run.');
		}

		// 3. Vänta tills run är klar
		let status;
		let retries = 30; // Max 30 sekunder
		do {
			await new Promise(res => setTimeout(res, 1000));

			const check = await this.openai.beta.threads.runs.retrieve(this.threadID, runID);
			status = check.status;

			if (status === 'failed') throw new Error('❌ Run misslyckades.');
			if (status === 'cancelled') throw new Error('❌ Run avbröts.');
		} while (status !== 'completed' && --retries > 0);

		if (status !== 'completed') {
			throw new Error('❌ Timeout: Run blev aldrig klar.');
		}

		// 4. Hämta senaste assistant-svar
		const messages = await this.openai.beta.threads.messages.list(this.threadID);
		const reply = messages.data.find(m => m.role === 'assistant');

		return reply?.content[0]?.text?.value || '⚠️ Inget svar från assistenten.';
	}

	async sendMessage_Working_Version(content) {
		if (!this.threadID) {
			const thread = await openai.beta.threads.create();
			this.threadID = thread.id;
		}

		await this.openai.beta.threads.messages.create(this.threadID, {
			role: 'user',
			content
		});

		const run = await this.openai.beta.threads.runs.createAndPoll(this.threadID, {
			assistant_id: this.assistantID
		});

		if (run.status !== 'completed') {
			throw new Error(`OpenAI run failed: Run status is ${run.status}`);
		}

		const messages = await this.openai.beta.threads.messages.list(this.threadID);
		const reply = messages.data.find(m => m.role === 'assistant');

		return reply?.content[0]?.text?.value || '';
	}
}

async function chat() {
	const assistantID = process.env.OPENAI_ASSISTANT_ID;
	await openai.beta.assistants.update(assistantID, {
		instructions: instructions
	});


	const readline = require('readline');
	let chatATP = new ChatATP();

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: '> '
	});

	console.log('\n💬 Starta chatt. Skriv "exit" för att avsluta.\n');
	rl.prompt();

	rl.on('line', async line => {
		if (line.trim().toLowerCase() === 'exit') {
			rl.close();
			return;
		}

		try {
			let reply = await chatATP.sendMessage(line);
			console.log(`\n${reply}\n`);
		} catch (error) {
			console.error(error);
		}

		rl.prompt();
	});
}

chat().catch(console.error);
