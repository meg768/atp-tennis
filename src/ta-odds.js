// The TA part of MariaDB's PLAYER_ODDS pricing, without a dependency on GPT.
const TA_ODDS_SQL = `
WITH probability AS (
	SELECT WIN_PROBABILITY_TA(
		(SELECT CASE WHEN COUNT(*)=1 THEN MIN(id) END FROM players WHERE id=? OR name=?),
		(SELECT CASE WHEN COUNT(*)=1 THEN MIN(id) END FROM players WHERE id=? OR name=?),
		?
	) AS p
)
SELECT
	CASE WHEN p>0 AND p<1 THEN ROUND(1 / LEAST(0.999, GREATEST(0.001, p*1.05)), 2) END AS player_ta,
	CASE WHEN p>0 AND p<1 THEN ROUND(1 / LEAST(0.999, GREATEST(0.001, (1-p)*1.05)), 2) END AS opponent_ta
FROM probability`;

async function getTaOdds(mysql, row) {
	const missing = { player_ta: null, opponent_ta: null };
	const aliases = { wien: 'Vienna', rom: 'Rome', 'paris masters': 'Paris' };
	const tournament = String(row.tournament || '').trim();
	if (!tournament) return missing;
	const events = await mysql.query({
		sql: `SELECT surface, type FROM events WHERE name=?
			AND date BETWEEN DATE_SUB(?, INTERVAL 20 DAY) AND DATE_ADD(?, INTERVAL 7 DAY)`,
		format: [aliases[tournament.toLowerCase()] || tournament, row.date, row.date]
	});
	if (events.length !== 1) return missing;
	const event = events[0];
	if (['Grand Slam', 'Next Gen Finals'].includes(event.type)) return missing;
	if (!['Hard', 'Clay', 'Grass'].includes(event.surface)) return missing;
	const [priced] = await mysql.query({
		sql: TA_ODDS_SQL,
		format: [row.player, row.player, row.opponent, row.opponent, event.surface]
	});
	if (priced?.player_ta == null || priced?.opponent_ta == null) return missing;
	const pair = [Number(priced.player_ta), Number(priced.opponent_ta)];
	if (!pair.every(value => Number.isFinite(value) && value >= 1)) return missing;
	return { player_ta: pair[0].toFixed(2), opponent_ta: pair[1].toFixed(2) };
}

module.exports = getTaOdds;
