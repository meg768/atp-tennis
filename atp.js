#!/usr/bin/env node

require("dotenv").config();

var App = function () {
    this.fileName = __filename;

    function run() {
        try {
            var args = require("yargs");

            args.usage("Usage: $0 <command> [options]");

            args.command(require("./commands/import.js"));
            args.command(require('./commands/events.js'));
            args.command(require('./commands/stats.js'));
            args.command(require('./commands/scores.js'));
            args.command(require('./commands/player.js'));
            args.command(require('./commands/activity.js'));
            args.command(require('./commands/rankings.js'));
            args.command(require('./commands/live.js'));
            args.command(require('./commands/serve.js'));
            args.command(require('./commands/update-elo.js'));
            args.command(require('./commands/update-stats.js'));

            args.help();
            args.wrap(null);

            args.check(function (argv) {
                return true;
            });

            args.demand(1);

            args.argv;
        } catch (error) {
            console.error(error.stack);
        }
    }

    run();
};

module.exports = new App();
