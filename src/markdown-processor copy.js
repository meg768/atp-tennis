


class MarkdownProcessor {
	constructor({mysql}) {
		this.mysql = mysql;
	}

	async process(markdown) {
		const blocks = [...markdown.matchAll(/```sql\s+([\s\S]+?)```/g)];

		for (const block of blocks) {
			const sql = block[1].trim();
			let result;

			try {
				result = await this.mysql.query(sql);
			} catch (err) {
				result = `**Fel i SQL:** ${err.message}`;
			}

			const replacement = typeof result === 'string' ? result : this.toMarkdownTable(result);
			markdown = markdown.replace(block[0], replacement);
		}

		return markdown;
	}


	toMarkdownTable(rows) {
		if (!Array.isArray(rows) || rows.length === 0) return '*Inga resultat*';

		const headers = Object.keys(rows[0]);
		const headerRow = `| ${headers.join(' | ')} |`;
		const dividerRow = `| ${headers.map(() => '---').join(' | ')} |`;
		const dataRows = rows.map(row => `| ${headers.map(h => row[h] ?? '').join(' | ')} |`);

		return [headerRow, dividerRow, ...dataRows].join('\n');
	}
}

module.exports = MarkdownProcessor;
