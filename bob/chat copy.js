#!/usr/bin/env node

require('dotenv').config({ path: '../.env' });

class ChatATP {
	constructor(options = {}) {
		console.log('🔍 THREAD_ID från miljövariabler:', process.env.OPENAI_THREAD_ID);

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
		await this.openai.beta.threads.messages.create(this.threadID, {
			role: 'user',
			content
		});

		const run = await this.openai.beta.threads.runs.createAndPoll(this.threadID, {
			assistant_id: this.assistantID
		});

		console.log('▶️ threadID:', this.threadID);
		console.log('▶️ run.id:', run.id);

		if (run.status !== 'completed') {
			throw new Error(`OpenAI run failed: Run status is ${run.status}`);
		}

		const messages = await this.openai.beta.threads.messages.list(this.threadID);
		const reply = messages.data.find(m => m.role === 'assistant');

		return reply?.content[0]?.text?.value || '';
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
		} catch (error) {
			console.error(error);
		}

		rl.prompt();
	});
}

chat().catch(console.error);
