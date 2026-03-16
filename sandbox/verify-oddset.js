#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const FetchOddset = require('../src/fetch-oddset');

function isSortedByStart(rows) {
	for (let index = 1; index < rows.length; index += 1) {
		const previous = Date.parse(rows[index - 1].start);
		const current = Date.parse(rows[index].start);

		if (previous > current) {
			return false;
		}
	}

	return true;
}

function normalizeCategoryToken(value = '') {
	return String(value).trim().toLowerCase();
}

function isATPFamilyToken(value = '') {
	const token = normalizeCategoryToken(value);
	return token === 'atp' || token.startsWith('atp_') || token === 'atp qual.' || token === 'atp qual' || token === 'atp qualifiers';
}

function isATPFamilyEvent(item) {
	const eventPath = Array.isArray(item?.event?.path) ? item.event.path : [];

	return eventPath.some(term =>
		isATPFamilyToken(term?.termKey) ||
		isATPFamilyToken(term?.name) ||
		isATPFamilyToken(term?.englishName)
	);
}

async function main() {
	const outputDir = path.resolve(__dirname, 'output');
	const reportPath = path.join(outputDir, 'verify-oddset.report.json');
	const fetcher = new FetchOddset({ log: () => {} });
	const states = ['STARTED', 'NOT_STARTED'];
	const raw = await fetcher.fetch({ states });
	const rows = await fetcher.parse(raw);
	const upcomingRows = rows.filter(row => row.state === 'NOT_STARTED');
	const liveRows = rows.filter(row => row.state === 'STARTED');
	const upcomingSourceItems = [...(raw.matches?.events || []), ...(raw.upcoming?.events || [])]
		.filter(item => item.event?.state === 'NOT_STARTED');
	const upcomingSourceById = new Map(upcomingSourceItems.map(item => [String(item.event?.id), item]));
	const nonATPUpcomingRows = upcomingRows.filter(row => {
		const sourceItem = upcomingSourceById.get(String(row.id));
		return sourceItem ? !isATPFamilyEvent(sourceItem) : false;
	});
	const qualifierRow = upcomingRows.find(row => {
		const sourceItem = upcomingSourceById.get(String(row.id));
		return sourceItem?.event?.path?.some(term => normalizeCategoryToken(term?.termKey).startsWith('atp_qual'));
	}) || null;

	assert(Array.isArray(rows), 'Expected parsed oddset response to be an array');
	assert(raw && typeof raw === 'object', 'Expected raw oddset payload bundle');
	assert(Array.isArray(raw.meta?.requestedStates), 'Expected raw.meta.requestedStates');
	assert(isSortedByStart(rows), 'Expected oddset rows sorted by start time');
	assert(upcomingRows.every(row => row.score === null), 'Expected NOT_STARTED rows to have score=null');
	assert(liveRows.every(row => row.score !== undefined), 'Expected STARTED rows to include score field');
	assert(nonATPUpcomingRows.length === 0, 'Expected NOT_STARTED rows to stay within ATP family');

	const report = {
		counts: {
			total: rows.length,
			live: liveRows.length,
			upcoming: upcomingRows.length
		},
		meta: raw.meta,
		errors: raw.errors,
		qualifierRow,
		firstUpcoming: upcomingRows[0] || null,
		firstLive: liveRows[0] || null
	};

	fs.mkdirSync(outputDir, { recursive: true });
	fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
	console.log(JSON.stringify(report, null, 2));
}

main().catch(error => {
	console.error(error.stack || String(error));
	process.exit(1);
});
