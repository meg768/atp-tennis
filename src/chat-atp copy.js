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
		await this.openai.beta.threads.messages.create(this.threadID, {
			role: 'user',
			content
		});


		const run = await this.openai.beta.threads.runs.createAndPoll(this.threadID, {
			assistant_id: this.assistantID
		});

		if (run.status !== 'completed') {
			throw new Error(`OpenAI run failed: ${run.status}`);
		}

		const messages = await this.openai.beta.threads.messages.list(this.threadID);
		const reply = messages.data.find(m => m.role === 'assistant');

		return reply?.content[0]?.text?.value || '';
	}
}

module.exports = ChatATP;
