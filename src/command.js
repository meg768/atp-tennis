class Command {
	constructor({command, description}) {
		this.command = command;
		this.describe = description;
		this.builder = this.arguments.bind(this);
		this.handler = this.run.bind(this);
	}

	arguments(yargs) {
	}

	async run(argv) {
	}

}

module.exports = Command;
