const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function askBob(question) {
	// 1. Skapa tråd
	const thread = await openai.beta.threads.create();
	console.log('🧵 Tråd-ID:', thread.id);

	// 2. Lägg till användarens fråga
	await openai.beta.threads.messages.create(thread.id, {
		role: 'user',
		content: question
	});

	// 3. Starta "run" på tråden med din assistent
	const run = await openai.beta.threads.runs.create(thread.id, {
		assistant_id: process.env.OPENAI_ASSISTANT_ID
	});

	// 4. Vänta tills run är klar
	let status;
	do {
		await new Promise(res => setTimeout(res, 1000));
		const check = await openai.beta.threads.runs.retrieve(thread.id, run.id);
		status = check.status;
		console.log(`⏳ Status: ${status}`);
	} while (status !== 'completed');

	// 5. Hämta svaret
	const messages = await openai.beta.threads.messages.list(thread.id);
	const reply = messages.data.find(msg => msg.role === 'assistant');
	console.log('🤖 Svar:', reply?.content[0]?.text?.value || '(Inget svar)');
}

// Exempelanrop
askBob('Svara i JSON-format. Hur många Grand Slam-titlar har Roger Federer?');
