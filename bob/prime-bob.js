#!/usr/bin/env node

require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const threadID = process.env.OPENAI_THREAD_ID;

const inputFiles = process.argv.slice(2);

if (!threadID) {
	console.error('❌ Saknar OPENAI_THREAD_ID i .env');
	process.exit(1);
}

if (inputFiles.length === 0) {
	console.error('❌ Ange en eller flera textfiler: t.ex. ./prime-bob.js *.txt');
	process.exit(1);
}

async function primeBobFromFile(file) {
	const filePath = path.resolve(file);
	if (!fs.existsSync(filePath)) {
		console.warn(`⚠️  Skipped (finns ej): ${file}`);
		return;
	}

	const content = fs.readFileSync(filePath, 'utf8').trim();
	if (!content) {
		console.warn(`⚠️  Skipped (tom fil): ${file}`);
		return;
	}

	await openai.beta.threads.messages.create(threadID, {
		role: 'assistant',
		content
	});

	console.log(`✅ Skickade: ${file}`);
}

(async () => {
	for (const file of inputFiles) {
		try {
			await primeBobFromFile(file);
		} catch (err) {
			console.error(`❌ Fel i ${file}:`, err.message);
		}
	}
})();
