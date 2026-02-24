const fs = require('fs');
const path = require('path');

module.exports = function logger(maxBytes = 1024 * 1024) {
	// 1 MB default

	const entryFile = require.main?.filename || process.argv[1];
	const baseName = path.basename(entryFile, path.extname(entryFile));
	const logFile = path.join(path.dirname(entryFile), `${baseName}.log`);

	function ts() {
		const d = new Date();
		const pad = n => String(n).padStart(2, '0');

		return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
	}

	function checkSize() {
		try {
			const { size } = fs.statSync(logFile);
			if (size > maxBytes) {
				fs.writeFileSync(logFile, ''); // trunkera
			}
		} catch {
			// filen finns inte ännu
		}
	}

	const originalLog = console.log;
	const originalError = console.error;

	const stream = fs.createWriteStream(logFile, { flags: 'a' });

	function write(line) {
		checkSize();
		stream.write(`${ts()} ${line}\n`);
	}

	console.log = (...args) => {
		write(args.join(' '));
		originalLog.apply(console, args);
	};

	console.error = (...args) => {
		write('[ERROR] ' + args.join(' '));
		originalError.apply(console, args);
	};
};
