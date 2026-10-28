module.exports = {
	apps: [{
		name: 'atp-odds',
		cwd: __dirname,
		script: './atp.js',
		args: 'odds',
		cron_restart: '0 * * * *',
		autorestart: false,
		watch: false,
		time: true,
		env: { TZ: 'Europe/Stockholm' }
	}]
};
