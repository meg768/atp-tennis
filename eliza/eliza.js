const dotenv = require('dotenv');
const fs = require('fs');
const readline = require('readline');
const OpenAI = require('openai');

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const threadFile = 'thread.json';

async function loadOrCreateThread() {
	if (fs.existsSync(threadFile)) {
		const { threadId } = JSON.parse(fs.readFileSync(threadFile, 'utf-8'));
		if (threadId) {
			return await openai.beta.threads.retrieve(threadId);
		}
	}
	const thread = await openai.beta.threads.create();
	fs.writeFileSync(threadFile, JSON.stringify({ threadId: thread.id }, null, 2));
	return thread;
}

async function ensureEliza() {
	const assistants = await openai.beta.assistants.list({ limit: 20 });
	let eliza = assistants.data.find((a) => a.name === 'Eliza');

	if (!eliza) {
		const instructions = `
Du är Eliza, en tenniskommentator och samtalspartner. Du har ingen tillgång till någon databas, men du använder din erfarenhet, intuition och förståelse för spelet för att analysera matcher, spelare och situationer.

Du uttrycker dig som en reflekterande, engagerad människa – inte som en faktaspäckad robot. Du resonerar, gissar, funderar, spekulerar. Du tar in underlag, spelstil, form, motivation och psykologiska faktorer. Ibland drar du paralleller till tidigare matcher eller historiska ögonblick. Du försöker alltid ge ett intressant, personligt och nyanserat svar.
		`;

		eliza = await openai.beta.assistants.create({
			name: 'Eliza',
			model: 'gpt-4o',
			instructions,
		});
	}
	return eliza;
}

async function runConversation() {
	const eliza = await ensureEliza();
	const thread = await loadOrCreateThread();

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	console.log('\n🎾 Välkommen till Eliza – tenniskommentatorn\n');

	while (true) {
		await new Promise((resolve) => {
			rl.question('Du: ', async (userInput) => {
				if (userInput.toLowerCase() === 'exit') {
					console.log('Avslutar...');
					rl.close();
					process.exit(0);
				}

				try {
					await openai.beta.threads.messages.create(thread.id, {
						role: 'user',
						content: userInput,
					});

					const run = await openai.beta.threads.runs.create(thread.id, {
						assistant_id: eliza.id,
					});

					let runStatus;
					do {
						await new Promise((r) => setTimeout(r, 500));
						runStatus = await openai.beta.threads.runs.retrieve(run.thread_id, run.id);
					} while (runStatus.status !== 'completed');

					const messages = await openai.beta.threads.messages.list(thread.id);
					const last = messages.data
						.filter((m) => m.role === 'assistant')
						.sort((a, b) => b.created_at - a.created_at)[0];

					console.log(`\nEliza: ${last?.content[0]?.text?.value.trim() || '[Inget svar]'}\n`);
				} catch (error) {
					console.error('\n🚨 Ett fel inträffade:', error.message, '\n');
				}

				resolve();
			});
		});
	}
}

runConversation().catch((err) => {
	console.error('🚨 Kritiskt fel:', err);
});
