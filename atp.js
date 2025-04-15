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
            args.command(require('./commands/fetch-stats.js'));
            args.command(require('./commands/fetch-event.js'));
            args.command(require('./commands/fetch-events.js'));
            args.command(require('./commands/fetch-player.js'));
            args.command(require('./commands/fetch-activity.js'));
            args.command(require('./commands/fetch-rankings.js'));
            args.command(require('./commands/fetch-live.js'));
            args.command(require('./commands/import-archive.js'));
            args.command(require('./commands/serve.js'));

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
