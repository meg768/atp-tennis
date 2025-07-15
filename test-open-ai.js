// test-openai.js
require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const gptSqlPrompt = require('./src/gpt-sql-prompt.js');


async function main() {

	const question = 'Gruppera alla spelare när de är födda per decennium . Hur många Grand Slam titlar har de vunnit totalt per grupp?';
	const prompt = gptSqlPrompt.getPrompt(question);
	
	const response = await openai.chat.completions.create({
		model: 'gpt-4',
		messages: [{ role: 'user', content: prompt }],
		temperature: 0,
		max_tokens: 256
	});

	console.log(JSON.stringify(response, null, 2));
	console.log(response.choices[0].message.content);
}

main().catch(console.error);
