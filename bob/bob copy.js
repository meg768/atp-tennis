#!/usr/bin/env node

require('dotenv').config({ path: '../.env' });

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { OpenAI } = require('openai');
const MySQL = require('../src/mysql.js');

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
	const chatATP = require('../src/chat-atp.js');

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
			console.error('❌ Fel:', error.message, error.stack ? `\n${error.stack}` : '');
		}

		rl.prompt();
	});
}

async function runCheckup(filePath, outputPath) {
	const chatATP = new ChatATP();
	const fullPath = path.resolve(filePath);
	const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
	const outputFile = path.resolve(outputPath);
	const outputLines = [`# Kontrollfrågor från ${filePath}\n`];

	for (const line of lines) {
		const question = line.trim();
		if (!question || question.startsWith('#')) continue;

		outputLines.push(`## Fråga\n${question}\n`);
		try {
			const reply = await chatATP.sendMessage(question);
			outputLines.push(`### Svar\n${reply}\n`);
			console.log(`✅ ${question}`);
		} catch (error) {
			outputLines.push(`❌ Fel vid fråga "${question}": ${error.message}\n`);
			console.error(`❌ Fel vid fråga "${question}":`, error.message);
		}
	}

	fs.writeFileSync(outputFile, outputLines.join('\n'));
	console.log(`\n📝 Resultat sparat till: ${outputFile}\n`);
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

(async () => {

	await MySQL.connect();

	if (mode === 'learn') {
		const instructionFile = getFlag('-i', '--instructions', './instructions.md');
		const dryRun = hasFlag('--dry-run');
		await updateBobPrompt(instructionFile, dryRun);
	} else if (mode === 'chat') {
		await startChat();
	} else if (mode === 'checkup') {
		const file = getFlag('-f', '--file', './checkup.txt');
		const out = getFlag('-o', '--output', './checkup.md');
		await runCheckup(file, out);
	} else {
		console.log(`Okänt kommando: ${mode}`);
		console.log(`\n🧠 Användning:
  node bob.js learn                 # Uppdatera Bob med bob-instructions.md
  node bob.js learn -i fil.md      # Uppdatera Bob med specifik fil
  node bob.js learn --dry-run      # Visa prompt utan att uppdatera
  node bob.js chat                 # Starta chatt med Bob
  node bob.js checkup -f fil.txt   # Kör automatiska kontrollfrågor
  node bob.js checkup -o svar.md   # (valfritt) Spara svar i angiven fil\n`);
		process.exit(1);
	}

	await MySQL.disconnect();
})();
