require('dotenv').config();

class ChatATP {
	constructor() {
		const { OpenAI } = require('openai');
		this.apiKey = process.env.OPENAI_API_KEY;
		this.assistantID = process.env.OPENAI_ASSISTANT_ID;
		this.threadID = null;
		this.storage = require('./storage.js');
		this.log = console.log;

		if (!this.apiKey) {
			throw new Error('API-key missing. Define OPENAI_API_KEY in environment variables.');
		}
		if (!this.assistantID) {
			throw new Error('Assistant-ID missing. Define OPENAI_ASSISTANT_ID in environment variables.');
		}

		this.openai = new OpenAI({ apiKey: this.apiKey });
	}

	getThreadID() {
		return this.threadID;
	}

	async ensureThread() {
		// Redan satt i minnet?
		if (this.threadID) return;

		let chat = await this.storage.get('chat');
		if (chat?.threadID && typeof chat.threadID === 'string') {
			this.threadID = chat.threadID;
			this.log(`🔁 Reusing existing thread ID: ${this.threadID}`);
			return;
		}

		// Skapa ny tråd
		this.log('🧵 Creating new thread for chat...');
		const thread = await this.openai.beta.threads.create();
		this.threadID = thread.id;

		await this.storage.set('chat', { threadID: this.threadID });
		this.log(`✅ New thread created with ID: ${this.threadID}`);
	}

	async sendMessage(content) {
		await this.ensureThread();

		this.log(`💬 Sending message to assistant: "${content}"`);
		await this.openai.beta.threads.messages.create(this.threadID, {
			role: 'user',
			content
		});

		const run = await this.openai.beta.threads.runs.createAndPoll(this.threadID, {
			assistant_id: this.assistantID
		});

		if (run.status !== 'completed') {
			throw new Error(`❌ OpenAI run failed: Run status is ${run.status}`);
		}

		const messages = await this.openai.beta.threads.messages.list(this.threadID);
		const reply = messages.data.find(m => m.role === 'assistant');

		const output = reply?.content[0]?.text?.value || '';
		this.log(`🤖 Assistant replied: "${output.slice(0, 100)}..."`);
		return output;
	}
}

module.exports = new ChatATP();
