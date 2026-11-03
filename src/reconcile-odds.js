const fs = require('node:fs');
const path = require('node:path');
const sql = fs.readFileSync(path.join(__dirname, '../database/reconcile-odds.sql'), 'utf8');

// Caller holds the collection lock and transaction; no TA calculation is allowed.
module.exports = mysql => mysql.query(sql);
