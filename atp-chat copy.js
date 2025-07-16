require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const { OpenAI } = require('openai');

/*
Visa antalet grand slam-titlar vunna grupperat på det decenium som spelaren föddes i.
*/

class ChatATP {
	constructor(options = {}) {
		let { assistantID, apiKey, threadID } = options;
		this.assistantID = assistantID || process.env.OPENAI_ASSISTANT_ID;
		this.threadID = threadID || process.env.OPENAI_THREAD_ID;
		this.openai = new OpenAI({ apiKey: apiKey });
	}

	async sendMessage(content) {
		function extractSQL(text) {
			if (!text) return '';

			// Försök hitta SQL i ett ```sql ... ``` block
			const match = text.match(/```sql\s*([\s\S]*?)```/i);

			if (match) {
				return match[1].trim(); // returnera endast SQL-delen
			}

			// Om inget block hittas, returnera texten som den är (trim:ad)
			return text.trim();
		}

		await this.openai.beta.threads.messages.create(this.threadID, {
			role: 'user',
			content
		});

		const run = await this.openai.beta.threads.runs.createAndPoll(this.threadID, {
			assistant_id: this.assistantID
		});

		if (run.status !== 'completed') {
			throw new Error(`❌ Run misslyckades: ${run.status}`);
		}

		const messages = await this.openai.beta.threads.messages.list(this.threadID);
		const reply = messages.data.find(m => m.role === 'assistant');

		return extractSQL(reply?.content[0]?.text?.value || '');
	}
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantId = process.env.OPENAI_ASSISTANT_ID;

const THREAD_FILE = './thread.json';

function extractSQL(text) {
	if (!text) return '';

	// Försök hitta SQL i ett ```sql ... ``` block
	const match = text.match(/```sql\s*([\s\S]*?)```/i);

	if (match) {
		return match[1].trim(); // returnera endast SQL-delen
	}

	// Om inget block hittas, returnera texten som den är (trim:ad)
	return text.trim();
}

async function getOrCreateThread() {
	if (fs.existsSync(THREAD_FILE)) {
		const { threadId } = JSON.parse(fs.readFileSync(THREAD_FILE, 'utf-8'));
		console.log('🔁 Återanvänder tråd:', threadId);
		return threadId;
	}

	const thread = await openai.beta.threads.create();
	fs.writeFileSync(THREAD_FILE, JSON.stringify({ threadId: thread.id }, null, 2));
	console.log('🆕 Skapade ny tråd:', thread.id);
	return thread.id;
}

async function sendMessage(threadId, content) {
	await openai.beta.threads.messages.create(threadId, {
		role: 'user',
		content
	});

	const run = await openai.beta.threads.runs.createAndPoll(threadId, {
		assistant_id: assistantId
	});

	if (run.status !== 'completed') {
		throw new Error(`❌ Run misslyckades: ${run.status}`);
	}

	const messages = await openai.beta.threads.messages.list(threadId);
	const reply = messages.data.find(m => m.role === 'assistant');
	return reply?.content[0]?.text?.value || '(Inget svar)';
}

async function chat() {
	const threadId = await getOrCreateThread();

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
			let reply = await sendMessage(threadId, line);
			reply = extractSQL(reply);
			console.log(`\n${reply}\n`);
		} catch (err) {
			console.error('❌ Fel:', err.message);
		}

		rl.prompt();
	});
}

chat().catch(console.error);
