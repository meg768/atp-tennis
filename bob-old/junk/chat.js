#!/usr/bin/env node

require('dotenv').config({ path: '../.env' });

const fs = require('fs');

const { OpenAI } = require('openai');
const ChatATP = require('../src/chat-atp.js');

async function chat() {
	const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
	const instructions = fs.readFileSync('./instructions.md', 'utf-8');

	const assistantID = process.env.OPENAI_ASSISTANT_ID;
	
	await openai.beta.assistants.update(assistantID, {
		instructions: instructions
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
