class MarkdownProcessor {
	constructor({ mysql, includeSQL = true }) {
		this.mysql = mysql;
		this.includeSQL = includeSQL;
	}

	async process(markdown) {
		const blocks = [...markdown.matchAll(/```sql\s+([\s\S]+?)```/g)];

		let resultMarkdown = markdown;
		for (const block of blocks) {
			const fullMatch = block[0];
			const sql = block[1].trim();
			let result;

			try {
				result = await this.mysql.query(sql);
			} catch (err) {
				result = `**Fel i SQL:** ${err.message}  
\`\`\`sql
${sql}
\`\`\``;
			}

			let replacement;
			if (typeof result === 'string') {
				replacement = result;
			} else {
				const table = this.toMarkdownTable(result);
				replacement = this.includeSQL ? `${table}\n\n\`\`\`sql\n${sql}\n\`\`\`` : table;
			}

			resultMarkdown = resultMarkdown.replace(fullMatch, replacement);
		}

		return resultMarkdown;
	}

	toMarkdownTable(rows) {
		if (!Array.isArray(rows) || rows.length === 0) {
			return '*Inga resultat från frågan*';
		}

		const headers = Object.keys(rows[0]);
		const headerRow = `| ${headers.join(' | ')} |`;
		const dividerRow = `| ${headers.map(() => '---').join(' | ')} |`;
		const dataRows = rows.map(row => `| ${headers.map(h => String(row[h] ?? '')).join(' | ')} |`);

		return [headerRow, dividerRow, ...dataRows].join('\n');
	}
}

module.exports = MarkdownProcessor;
