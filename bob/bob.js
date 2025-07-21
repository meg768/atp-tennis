#!/usr/bin/env node

require('dotenv').config({ path: '../.env' });

const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const ChatATP = require('../src/chat-atp.js');
const readline = require('readline');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function updateBobPrompt(instructionPath, dryRun) {
	const assistantID = process.env.OPENAI_ASSISTANT_ID;
	const filePath = path.resolve(instructionPath);
	const instructions = fs.readFileSync(filePath, 'utf-8');

	if (dryRun) {
		console.log(`\n📄 Dry-run – innehållet i "${instructionPath}":\n`);
		console.log(instructions);
		console.log('\n🚫 Ingen uppdatering skickades till OpenAI.\n');
		return;
	}

	const response = await openai.beta.assistants.update(assistantID, {
		instructions
	});

	console.log(`✅ Assistent '${response.name}' uppdaterades med innehållet från "${instructionPath}".\n`);
}

async function startChat() {
	const chatATP = new ChatATP();

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: '> '
	});

	console.log('\n💬 Starta chatt med Bob. Skriv "exit" för att avsluta.\n');
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
			console.error('❌ Fel:', error.message);
		}

		rl.prompt();
	});
}

// CLI-parser
const args = process.argv.slice(2);
const mode = args[0];
const flags = args.slice(1);

const getFlag = (short, long, fallback = null) => {
	const shortIndex = flags.indexOf(short);
	const longIndex = flags.indexOf(long);
	const index = shortIndex !== -1 ? shortIndex : longIndex !== -1 ? longIndex : -1;
	return index !== -1 ? flags[index + 1] : fallback;
};

const hasFlag = flag => flags.includes(flag);

// Kör logik baserat på kommando
(async () => {
	if (mode === 'learn') {
		const instructionFile = getFlag('-i', '--instructions', 'bob.md');
		const dryRun = hasFlag('--dry-run');
		await updateBobPrompt(instructionFile, dryRun);
	} else if (mode === 'chat') {
		await startChat();
	} else {
		console.log(`❓ Okänt kommando: ${mode}`);
		console.log(`\n🧠 Användning:
  node bob.js learn                 # Uppdatera Bob med instructions.md
  node bob.js learn -i fil.md      # Uppdatera Bob med specifik fil
  node bob.js learn --dry-run      # Visa prompt utan att uppdatera
  node bob.js chat                 # Starta chatt med Bob\n`);
		process.exit(1);
	}
})();
