require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantId = process.env.OPENAI_ASSISTANT_ID;

async function waitForRunCompletion(runId, intervalMs = 1000) {
	if (!runId) {
		throw new Error(`❌ Ogiltig runId: ${runId}`);
	}

	while (true) {
		const run = await openai.beta.threads.runs.retrieve(runId);
		if (run.status === 'completed') return run;
		if (['failed', 'cancelled', 'expired'].includes(run.status)) {
			throw new Error(`Run failed with status: ${run.status}`);
		}
		console.log(`⏳ Status: ${run.status}`);
		await new Promise(res => setTimeout(res, intervalMs));
	}
}

async function main() {
	const thread = await openai.beta.threads.create();

	console.log('🧵 Tråd-ID:', thread?.id);

	const message = await openai.beta.threads.messages.create(thread.id, {
		role: 'user',
		content: 'Vem har vunnit flest Grand Slam titlar i tennis?'
	});

	let run = await openai.beta.threads.runs.createAndPoll(thread.id, {
		assistant_id: assistantId,
		instructions: 'Please address the user as Jane Doe. The user has a premium account.'
	});

	console.log('🏃 Run-ID:', run?.id);

	if (run.status === 'completed') {
		const messages = await openai.beta.threads.messages.list(run.thread_id);
		for (const message of messages.data.reverse()) {
			console.log(`${message.role} > ${message.content[0].text.value}`);
		}
	} else {
		console.log(run.status);
	}

}

main().catch(console.error);
