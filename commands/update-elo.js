let Probe = require('../src/probe.js');
let Command = require('../src/command.js');
let { updateELO, computeELO } = require('../src/elo.js');

class Module extends Command {
	constructor() {
		super({ command: 'update-elo [options]', description: 'Update ELO ranking' });
		this.mysql = require('../src/mysql.js');
	}

	arguments(args) {
		args.help();
	}

	async run(argv) {
		this.argv = argv;

		await this.mysql.connect();

		try {
			await updateELO({ mysql: this.mysql });
		} finally {
			await this.mysql.disconnect();
		}
	}
}

module.exports = new Module();
