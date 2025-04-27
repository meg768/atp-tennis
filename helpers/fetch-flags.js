// download-flags.js
const fs = require('fs');
const path = require('path');
//const fetch = require('node-fetch');

const countries = [
	'HAI',
	'USA',
	'TUR',
	'FRA',
	'ESP',
	'CAN',
	'BUL',
	'RUS',
	'PUR',
	'ITA',
	'GRE',
	'SGP',
	'CRO',
	'JOR',
	'POR',
	'MAR',
	'EGY',
	'TOG',
	'UAE',
	'KAZ',
	'SLO',
	'KSA',
	'BLR',
	'QAT',
	'VEN',
	'MEX',
	'ROU',
	'IRL',
	'URU',
	'JAM',
	'BEN',
	'AUS',
	'ARG',
	'NOR',
	'SWE',
	'SUI',
	'AZE',
	'PHI',
	'ECU',
	'PER',
	'GBR',
	'BRA',
	'GER',
	'AUT',
	'RSA',
	'CHI',
	'KOR',
	'IND',
	'KUW',
	'LBN',
	'SYR',
	'ALG',
	'TUN',
	'GHA',
	'MDA',
	'OMA',
	'BOL',
	'ESA',
	'TJK',
	'UKR',
	'IRI',
	'INA',
	'BEL',
	'PAK',
	'BIH',
	'MON',
	'MAS',
	'COL',
	'MAD',
	'PAR',
	'NGR',
	'NZL',
	'LTU',
	'POL',
	'CIV',
	'NED',
	'ZIM',
	'ISR',
	'CRC',
	'EST',
	'HUN',
	'SVK',
	'DEN',
	'HKG',
	'CYP',
	'GUA',
	'AHO',
	'ARM',
	'LUX',
	'DOM',
	'CZE',
	'SRB',
	'POC',
	'CHN',
	'THA',
	'GEO',
	'FIN',
	'KEN',
	'JPN',
	'TPE',
	'CUB',
	'LAT',
	'VIE',
	'UZB',
	'MKD',
	'SRI',
	'BAH',
	'BAR',
	'TTO',
	'AND',
	'MNE',
	'VAN',
	'SLE',
	'SAM',
	'SOL',
	'GUM',
	'TKM',
	'MSH',
	'PNG',
	'NMI',
	'YUG',
	'KOS',
	'NAM'
];

const outputDir = path.resolve(__dirname, 'flags');

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir);
}

const baseUrl = 'https://www.atptour.com/en/~/media/images/flags';

async function downloadFlag(code) {
	const url = `${baseUrl}/${code}.svg`;
	const dest = path.join(outputDir, `${code}.svg`);

	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`❌ Failed for ${code}: ${res.status}`);
		const buffer = await res.text();
		fs.writeFileSync(dest, buffer);
		console.log(`✅ Downloaded: ${code}`);
	} catch (err) {
		console.warn(err.message);
	}
}

(async () => {
	for (const code of countries) {
		await downloadFlag(code);
	}

	console.log('🎉 All done!');
})();
