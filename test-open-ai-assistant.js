require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantId = process.env.OPENAI_ASSISTANT_ID;

async function main() {
	const threadId = process.env.OPENAI_THREAD_ID; // await openai.beta.threads.create();

	console.log('🧵 Tråd-ID:', threadId);

	await openai.beta.threads.messages.create(threadId, {
		role: 'user',
		content: 'Hur många Grand Slam titlar har Roger Federer vunnit?'
	});

	const run = await openai.beta.threads.runs.createAndPoll(threadId, {
		assistant_id: assistantId
	});

	console.log('✅ Run klar med status:', run.status);

	const messages = await openai.beta.threads.messages.list(threadId);
	const assistantReply = messages.data.find(msg => msg.role === 'assistant');

	console.log('💬 Svar:', assistantReply?.content[0]?.text?.value);
}

main().catch(console.error);
