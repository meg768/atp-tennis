const fs = require('fs');
const path = require('path');

const data = [
	{ year: '2010', gap1to2: 3305, gap2to3: 3110, gap3to4: 275, gap4to5: 180 },
	{ year: '2011', gap1to2: 4035, gap2to3: 1425, gap3to4: 790, gap4to5: 2455 },
	{ year: '2012', gap1to2: 2655, gap2to3: 2265, gap3to4: 1310, gap4to5: 185 },
	{ year: '2013', gap1to2: 770, gap2to3: 6460, gap3to4: 10, gap4to5: 535 },
	{ year: '2014', gap1to2: 1585, gap2to3: 2940, gap3to4: 1465, gap4to5: 345 },
	{ year: '2015', gap1to2: 7640, gap2to3: 680, gap3to4: 1400, gap4to5: 1635 },
	{ year: '2016', gap1to2: 630, gap2to3: 6330, gap3to4: 135, gap4to5: 410 },
	{ year: '2017', gap1to2: 1040, gap2to3: 4455, gap3to4: 540, gap4to5: 595 },
	{ year: '2018', gap1to2: 1565, gap2to3: 1060, gap3to4: 35, gap4to5: 1085 },
	{ year: '2019', gap1to2: 840, gap2to3: 2555, gap3to4: 765, gap4to5: 120 },
	{ year: '2020', gap1to2: 2180, gap2to3: 725, gap3to4: 655, gap4to5: 1840 },
	{ year: '2021', gap1to2: 2900, gap2to3: 800, gap3to4: 1300, gap4to5: 1390 },
	{ year: '2022', gap1to2: 800, gap2to3: 200, gap3to4: 270, gap4to5: 730 },
	{ year: '2023', gap1to2: 2390, gap2to3: 1255, gap3to4: 1110, gap4to5: 1685 },
	{ year: '2024', gap1to2: 3915, gap2to3: 905, gap3to4: 1910, gap4to5: 70 },
	{ year: '2025', gap1to2: 550, gap2to3: 6390, gap3to4: 290, gap4to5: 630 },
	{ year: '2026', gap1to2: 1190, gap2to3: 7195, gap3to4: 485, gap4to5: 455 },
];

const series = [
	{ key: 'gap1to2', label: '#1-#2', color: '#22c55e' },
	{ key: 'gap2to3', label: '#2-#3', color: '#f59e0b' },
	{ key: 'gap3to4', label: '#3-#4', color: '#0ea5e9' },
	{ key: 'gap4to5', label: '#4-#5', color: '#f43f5e' },
];

const width = 1480;
const height = 760;
const margin = { top: 80, right: 40, bottom: 110, left: 80 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;
const maxTotal = Math.max(...data.map((row) => series.reduce((sum, entry) => sum + row[entry.key], 0)));
const roundedMax = Math.ceil(maxTotal / 1000) * 1000;
const maxValue = roundedMax;
const tickStep = 2000;
const yearBand = plotWidth / data.length;
const barWidth = yearBand * 0.52;

function yScale(value) {
	return margin.top + plotHeight - (value / maxValue) * plotHeight;
}

function xForGroup(index) {
	return margin.left + index * yearBand + (yearBand - barWidth) / 2;
}

function escape(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

const gridLines = [];
for (let tick = 0; tick <= maxValue; tick += tickStep) {
	const y = yScale(tick);
	gridLines.push(`<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#334155" stroke-dasharray="4 4" />`);
	gridLines.push(
		`<text x="${margin.left - 12}" y="${y + 6}" fill="#94a3b8" font-size="14" text-anchor="end" font-family="Arial">${tick.toLocaleString()}</text>`
	);
}

const bars = [];
const yearLabels = [];

data.forEach((row, index) => {
	const groupX = xForGroup(index);
	yearLabels.push(
		`<text x="${groupX + barWidth / 2}" y="${height - 48}" fill="#cbd5e1" font-size="15" text-anchor="middle" font-family="Arial">${row.year}</text>`
	);

	let stackedTop = margin.top + plotHeight;

	series.forEach((entry, seriesIndex) => {
		const value = row[entry.key];
		const segmentHeight = (value / maxValue) * plotHeight;
		const y = stackedTop - segmentHeight;
		const h = segmentHeight;
		const x = groupX;
		const radius = seriesIndex === series.length - 1 ? '4 4 0 0' : '0 0 0 0';
		bars.push(
			`<rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="${radius.split(' ')[0]}" fill="${entry.color}">
				<title>${escape(`${row.year} ${entry.label}: ${value.toLocaleString()} points`)}</title>
			</rect>`
		);
		stackedTop = y;
	});
});

const legend = series
	.map((entry, index) => {
		const x = width - 330;
		const y = 34 + index * 24;
		return `
			<rect x="${x}" y="${y - 12}" width="14" height="14" rx="3" fill="${entry.color}" />
			<text x="${x + 24}" y="${y}" fill="#e2e8f0" font-size="15" font-family="Arial">${entry.label}</text>
		`;
	})
	.join('');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Arial">
	<rect width="100%" height="100%" fill="#0f172a" />
	<text x="${margin.left}" y="40" fill="#f8fafc" font-size="32" font-weight="700" font-family="Arial">ATP Ranking Gap by Year</text>
	<text x="${margin.left}" y="68" fill="#94a3b8" font-size="18" font-family="Arial">Stacked yearly bars for adjacent top-5 point gaps, 2010-2026</text>
	<rect x="${width - 350}" y="18" width="294" height="108" rx="12" fill="#111827" stroke="#334155" />
	${legend}
	${gridLines.join('\n')}
	<line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${width - margin.right}" y2="${margin.top + plotHeight}" stroke="#64748b" />
	<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#64748b" />
	${bars.join('\n')}
	${yearLabels.join('\n')}
	<text x="${margin.left - 56}" y="${margin.top - 24}" fill="#cbd5e1" font-size="15" transform="rotate(-90 ${margin.left - 56} ${margin.top - 24})" font-family="Arial">Points</text>
	<text x="${width / 2}" y="${height - 16}" fill="#94a3b8" font-size="15" text-anchor="middle" font-family="Arial">ATP season-end ranking snapshot</text>
</svg>`;

fs.writeFileSync(path.join(__dirname, 'ranking-gap-stacked-chart.svg'), svg, 'utf8');
console.log(path.join(__dirname, 'ranking-gap-stacked-chart.svg'));
