let MySQL = require('../src/mysql.js');
let Probe = require('../src/probe.js');
let Command = require('../src/command.js');
let { updateELO, computeELO } = require('../src/elo.js');

class Module extends Command {
	constructor() {
		super({ command: 'update-elo [options]', description: 'Update ELO ranking' });
		this.mysql = new MySQL();
	}

	arguments(args) {
		args.help();
	}

	async run(argv) {
		this.argv = argv;

		this.mysql.connect();

		await updateELO({ mysql: this.mysql });

		this.mysql.disconnect();
	}
}

module.exports = new Module();
