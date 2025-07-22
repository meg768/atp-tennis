#!/usr/bin/env node

require('dotenv').config({ path: '../.env' });

const fs = require('fs');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function updateAssistant() {
	const assistantID = process.env.OPENAI_ASSISTANT_ID;
	const instructionsPath = './instructions.md';

	// Läs in markdown-filen
	const instructions = fs.readFileSync(instructionsPath, 'utf-8');

	if (process.argv.includes('--dry-run')) {
		console.log('\n📄 Preview av instruktioner (dry-run):\n');
		console.log(instructions);
		console.log('\n🚫 Ingen uppdatering skickades till OpenAI.\n');
		process.exit(0);
	}

	// Uppdatera assistenten
	const response = await openai.beta.assistants.update(assistantID, {
		instructions
	});

	console.log(`✅ Assistent '${response.name}' uppdaterades.\n`);
}

updateAssistant().catch(error => {
	console.error('❌ Fel vid uppdatering:', error.message);
});
