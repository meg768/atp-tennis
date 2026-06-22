const { execFile } = require('child_process');
const path = require('path');
const os = require('os');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const ATP_COOKIE_JAR = path.join(os.tmpdir(), 'atp-tennis-cookies.txt');

class NonRetryableFetchError extends Error {
	constructor(message) {
		super(message);
		this.nonRetryable = true;
	}
}

class Gopher {
	constructor() {}

	isATP(url) {
		try {
			let hostname = new URL(url).hostname;
			return hostname === 'atptour.com' || hostname.endsWith('.atptour.com');
		} catch (error) {
			return false;
		}
	}

	async fetchWithCurl(url, options) {
		let headerArgs = [];

		for (let [key, value] of Object.entries(options.headers || {})) {
			headerArgs.push('-H', `${key}: ${value}`);
		}

		let stdout = null;
		let attempts = [
			['--http1.1', '--no-alpn', '-fsS', '-b', ATP_COOKIE_JAR, '-c', ATP_COOKIE_JAR, '-D', '-', '-o', '-', url, ...headerArgs],
			['--http1.1', '-fsS', '-b', ATP_COOKIE_JAR, '-c', ATP_COOKIE_JAR, '-D', '-', '-o', '-', url, ...headerArgs]
		];
		let lastError = null;

		for (let args of attempts) {
			try {
				({ stdout } = await execFileAsync('curl', args, { maxBuffer: 50 * 1024 * 1024 }));
				break;
			} catch (error) {
				if (this.isCloudflareChallenge(error.stdout)) {
					throw new NonRetryableFetchError(`Failed to fetch ${url}: Cloudflare challenge`);
				}
				lastError = error;
			}
		}

		if (!stdout) {
			throw lastError || new Error(`Failed to fetch ${url}`);
		}
		let separator = stdout.includes('\r\n\r\n') ? '\r\n\r\n' : '\n\n';
		let index = stdout.indexOf(separator);

		if (index < 0) {
			throw new Error(`Failed to fetch ${url}: malformed curl response`);
		}

		let headerText = stdout.slice(0, index);
		let bodyText = stdout.slice(index + separator.length);
		let status = Number((headerText.match(/^HTTP\/\S+\s+(\d+)/) || [])[1]);
		let contentType = (headerText.match(/^content-type:\s*(.+)$/im) || [])[1] || '';

		if (this.isCloudflareChallenge(stdout)) {
			throw new NonRetryableFetchError(`Failed to fetch ${url}: Cloudflare challenge`);
		}

		if (!status || status < 200 || status >= 300) {
			throw new Error(`Failed to fetch ${url} (${status || 'unknown'})`);
		}

		if (contentType.includes('application/json')) {
			return JSON.parse(bodyText);
		}

		throw new Error(`Expected JSON but got ${contentType}`);
	}

	async fetch(url, options) {
		let retryCount = options?.retryCount || 3;
		let retryDelay = options?.retryDelay || 30000;

		const defaultHeaders = {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
			'Accept': 'application/json'
		};

		options = {
			...options,
			headers: {
				...defaultHeaders,
				...(options?.headers || {})
			}
		};

		async function pause(delay) {
			return new Promise((resolve, reject) => {
				setTimeout(() => resolve(), delay);
			});
		}

		async function fetchOnce() {
			if (this.isATP(url)) {
				return await this.fetchWithCurl(url, options);
			}

			const response = await fetch(url, options);

			if (!response.ok) {
				throw new Error(`Failed to fetch ${url} (${response.status})`);
			}

			const contentType = response.headers.get('content-type') || '';
			const bodyText = await response.text();

			// Försök bara JSON om det verkar vara JSON
			if (contentType.includes('application/json')) {
				return JSON.parse(bodyText);
			}

			throw new Error(`Expected JSON but got ${contentType}`);
		}

		for (let attempt = 1; attempt <= retryCount; attempt++) {
			try {
				return await fetchOnce.call(this);
			} catch (error) {
				if (error.nonRetryable) {
					throw error;
				}

				if (attempt === retryCount) {
					console.log(error.message);
				}
				await pause(retryDelay);
			}
		}

		throw new Error(`Failed to fetch ${url} after ${retryCount} attempts`);
	}

	isCloudflareChallenge(text) {
		return typeof text === 'string' && /(^|\n)cf-mitigated:\s*challenge/im.test(text);
	}
}

module.exports = new Gopher();
