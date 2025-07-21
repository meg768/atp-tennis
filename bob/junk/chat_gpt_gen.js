#!/usr/bin/env node

require('dotenv').config({ path: '../.env' });


const { OpenAI } = require('openai');
const ChatATP = require('../src/chat-atp.js');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function chat() {
	const assistantID = process.env.OPENAI_ASSISTANT_ID;

	// Läs in instruktioner från lokal markdown-fil
	const instructions = fs.readFileSync('./instructions.md', 'utf-8');

	// Om skriptet körs med --dry-run, skriv bara ut instruktionerna
	if (process.argv.includes('--dry-run')) {
		console.log('\n📄 Prompt preview (dry run):\n');
		console.log(instructions);
		console.log('\n🚫 Assistenten uppdaterades inte.\n');
		process.exit(0);
	}

	// Uppdatera assistenten
	await openai.beta.assistants.update(assistantID, {
		instructions
	});

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
