#!/usr/bin/env node

require('dotenv').config({ path: '../.env' });

const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function createThread() {
	const thread = await openai.beta.threads.create();
	console.log(thread.id);
}

createThread().catch(err => {
	console.error('❌ Fel vid skapande av thread:', err.message);
});
