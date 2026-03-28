function sanitizeSQL(sql) {
	let result = '';
	let mode = 'code';

	for (let index = 0; index < sql.length; index++) {
		const current = sql[index];
		const next = sql[index + 1];

		if (mode === 'code') {
			if (current === "'" || current === '"' || current === '`') {
				mode = current;
				result += ' ';
				continue;
			}

			if (current === '-' && next === '-') {
				mode = 'line-comment';
				result += '  ';
				index++;
				continue;
			}

			if (current === '#') {
				mode = 'line-comment';
				result += ' ';
				continue;
			}

			if (current === '/' && next === '*') {
				mode = 'block-comment';
				result += '  ';
				index++;
				continue;
			}

			result += current;
			continue;
		}

		if (mode === 'line-comment') {
			if (current === '\n') {
				mode = 'code';
				result += '\n';
			} else {
				result += ' ';
			}

			continue;
		}

		if (mode === 'block-comment') {
			if (current === '*' && next === '/') {
				mode = 'code';
				result += '  ';
				index++;
			} else {
				result += current === '\n' ? '\n' : ' ';
			}

			continue;
		}

		if (current === '\\') {
			result += ' ';

			if (index + 1 < sql.length) {
				result += sql[index + 1] === '\n' ? '\n' : ' ';
				index++;
			}

			continue;
		}

		if (current === mode) {
			mode = 'code';
			result += ' ';
			continue;
		}

		result += current === '\n' ? '\n' : ' ';
	}

	return result;
}

function splitStatements(sql) {
	const statements = [];
	let current = '';

	for (let index = 0; index < sql.length; index++) {
		const char = sql[index];

		if (char === ';') {
			if (current.trim() !== '') {
				statements.push(current.trim());
			}

			current = '';
			continue;
		}

		current += char;
	}

	if (current.trim() !== '') {
		statements.push(current.trim());
	}

	return statements;
}

function getLeadingKeyword(statement) {
	const match = statement.match(/^(?:\(+\s*)*([a-z]+)/i);
	return match?.[1]?.toLowerCase();
}

function assertSafeStatement(statement) {
	const leadingKeyword = getLeadingKeyword(statement);
	const allowedKeywords = new Set(['select', 'with', 'show', 'describe', 'desc', 'explain']);

	if (!allowedKeywords.has(leadingKeyword)) {
		throw new Error(`Only read-only SQL statements are allowed. Rejected statement starting with '${leadingKeyword || 'unknown'}'.`);
	}

	const disallowedPatterns = [
		/\b(insert|update|delete|replace|drop|alter|truncate|create|rename|grant|revoke|commit|rollback|start|begin|set|use|call|lock|unlock|optimize|repair|analyze|flush|reset|purge|kill|change|install|uninstall|handler|load|prepare|execute|deallocate)\b/i,
		/\binto\s+(outfile|dumpfile)\b/i,
		/\bfor\s+update\b/i,
		/\block\s+in\s+share\s+mode\b/i
	];

	for (const pattern of disallowedPatterns) {
		if (pattern.test(statement)) {
			throw new Error('Only read-only SQL statements are allowed.');
		}
	}
}

function assertReadOnlySQL(sql) {
	if (typeof sql !== 'string' || sql.trim() === '') {
		throw new Error('SQL string is required.');
	}

	const sanitizedSQL = sanitizeSQL(sql);
	const statements = splitStatements(sanitizedSQL);

	if (statements.length === 0) {
		throw new Error('SQL string is required.');
	}

	for (const statement of statements) {
		assertSafeStatement(statement);
	}
}

module.exports = assertReadOnlySQL;
