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
        if (this.startTime == null) {
            this.start();
        }

        if (this.stopTime == null) {
            this.stop();
        }

        let then = this.startTime;
        let now = this.stopTime;
        let seconds = Math.round(((now - then) / 1000) * 10) / 10;

        if (seconds >= 10) {
            seconds = Math.round(seconds);
        }

        let text = `${seconds} seconds`;

        if (seconds >= 60) {
            text = `${Math.round(seconds / 60)} minute(s)`;
        }

        return text;
    }
}

module.exports = Probe;
