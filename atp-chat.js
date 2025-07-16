require('dotenv').config();

class ChatATP {
	constructor(options = {}) {
		const { OpenAI } = require('openai');
		let { assistantID, apiKey, threadID } = options;
		this.apiKey = apiKey || process.env.OPENAI_API_KEY;
		this.assistantID = assistantID || process.env.OPENAI_ASSISTANT_ID;
		this.threadID = threadID || process.env.OPENAI_THREAD_ID;

		if (!this.apiKey) {
			throw new Error('API-key missing. Define OPENAI_API_KEY in environment variables.');
		}
		if (!this.assistantID) {
			throw new Error('Assistant-ID missing. Define OPENAI_ASSISTANT_ID in environment variables.');
		}
		if (!this.threadID) {
			throw new Error('Tråd-ID missing. Define OPENAI_THREAD_ID in environment variables.');
		}

		this.openai = new OpenAI({ apiKey: this.apiKey });
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
			throw new Error(`OPenAI run failed: ${run.status}`);
		}

		const messages = await this.openai.beta.threads.messages.list(this.threadID);
		const reply = messages.data.find(m => m.role === 'assistant');

		return extractSQL(reply?.content[0]?.text?.value || '');
	}
}

async function chat() {
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
		} catch (err) {
			console.error('❌ Fel:', err.message);
		}

		rl.prompt();
	});
}

chat().catch(console.error);
