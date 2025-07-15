const fs = require('fs');
const path = require('path');

class GptPrompt {
    constructor() {
        this.prompt = fs.readFileSync(path.join(__dirname, 'gpt-sql-prompt.txt'), 'utf8');
    }

    getPrompt(question) {
        return `${this.prompt}\nSkriv en MySQL-sats som svarar på: "${question}"`;
    }
}

module.exports = new GptPrompt();

