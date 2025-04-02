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
            args.command(require('./commands/importx.js'));
            args.command(require('./commands/test.js'));

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
