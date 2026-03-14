class Probe {
	constructor() {
		this.startTime = null;
		this.stopTime = null;

		this.start();
	}

	start() {
		this.startTime = new Date();
	}

	stop() {
		this.stopTime = new Date();
	}

	toString() {
		function formatUnit(value, unit) {
			return `${value} ${unit}${value === 1 ? '' : 's'}`;
		}

		if (this.startTime == null) {
			this.start();
		}

		if (this.stopTime == null) {
			this.stop();
		}

		let elapsedMs = this.stopTime - this.startTime;
		let totalSeconds = elapsedMs / 1000;

		if (totalSeconds < 60) {
			let seconds = Math.round(totalSeconds);
			return formatUnit(seconds, 'second');
		}

		let roundedSeconds = Math.round(totalSeconds);
		let hours = Math.floor(roundedSeconds / 3600);
		let minutes = Math.floor((roundedSeconds % 3600) / 60);
		let seconds = roundedSeconds % 60;
		let parts = [];

		if (hours > 0) {
			parts.push(formatUnit(hours, 'hour'));
		}

		if (minutes > 0) {
			parts.push(formatUnit(minutes, 'minute'));
		}

		if (hours === 0 && seconds > 0) {
			parts.push(formatUnit(seconds, 'second'));
		}

		return parts.join(' ');
	}
}

module.exports = Probe;
