// test-openai.js
require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const basicPrompt = `
Du är en SQL-expert. Databasen innehåller följande tabeller:

players(id, name, country)
matches(id, event, round, winner, loser, score)
events(id, date, name, location, type, surface)

Relationer:
- matches.winner och matches.loser refererar till players.id
- matches.event refererar till events.id
- players.country är en landskod, t.ex. 'USA', 'GBR'
- matches.round är ett värde som: 'F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128'
- events.surface är ett av: 'Grass', 'Hard', 'Clay', 'Carpet'
- events.type är ett av: 'Grand Slam', 'Masters', 'ATP-500', 'ATP-250', 'Rod Laver Cup', 'Davis Cup', 'Olympics'

Regler:
- Endast SELECT-satser. Inga kommentarer.
- Vid sökning på spelarnamn, använd players.name med LIKE '%namn%'
- Om något är oklart eller inte går att besvara korrekt, returnera en korrekt MySQL-sats av typen:
  SELECT 'förklaring här' AS \`!\`; Ingenting annat.
- Använd svensk namngivning för genererade kolumner.
- Svara ALDRIG med naturligt språk. Svara ENDAST med en giltig MySQL-sats.
`;

async function main() {

	const question = 'Visa de bästa spelarna genom tiderna, top 10';
	const prompt = `${basicPrompt}\nSkriv en MySQL-sats som svarar på: "${question}"`;
	
	console.log(prompt);
	const response = await openai.chat.completions.create({
		model: 'gpt-4',
		messages: [{ role: 'user', content: prompt }],
		temperature: 0,
		max_tokens: 256
	});

	console.log(response.choices[0].message.content);
}

main().catch(console.error);
