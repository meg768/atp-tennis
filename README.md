# ATP Tennis

Node.js (CommonJS) app that imports ATP data into MariaDB, updates player metrics (stats + ELO), and exposes a local API for live and ranking data.

## What It Does
- Imports rankings, activity, event results, and player details from ATP endpoints.
- Stores/upserts data in MariaDB tables (`events`, `matches`, `players`, etc.).
- Updates `serve/return/pressure` ratings and ELO.
- Exposes HTTP endpoints via `node atp.js serve`.

## Requirements
- Node.js 20+ (built-in `fetch` is used in multiple modules).
- MariaDB with tables/views from `database/schema.sql`.
- SQL helper functions from `database/functions/*.sql`.
- SQL procedures from `database/procedures/*.sql` when required.
- MariaDB user permissions that allow creating the tables, view, helper functions, and procedures defined in the repo-managed database files.

## Environment (`.env`)

```env
MYSQL_HOST=
MYSQL_USER=
MYSQL_PORT=
MYSQL_PASSWORD=
MYSQL_DATABASE=
```

## Install

```bash
npm install
```

## Database Bootstrap

Apply the repo-managed database objects in this order:

1. `database/schema.sql`
2. Each SQL file in `database/functions/`
3. Each SQL file in `database/procedures/`

The app expects those objects to already exist before you run `import` or `serve`.

## CLI

Show all commands:

```bash
node atp.js --help
```

Available commands (from `atp.js`):
- `import [options]` - Full import pipeline (rankings -> activity -> scores -> players -> stats -> ELO -> surface factors).
- `serve [options]` - Start local API server.

### Common Command Examples

```bash
node atp.js import --top 100 --since 2025
node atp.js serve
```

### Important Options
- `import`: `--top`, `--since`, `--clean`, `--loop` (hours; default `12`), `--light`.

## Helper Scripts

Manual maintenance scripts are documented in [helpers/README.md](./helpers/README.md).

## API Service

Start:

```bash
node atp.js serve
```

Bind address: `127.0.0.1:3004`

Endpoints (from `commands/serve.js`):
- `GET /ok`
- `GET /api/ping`
- `GET /api/matches/live`
- `GET /api/player/rankings`
- `GET /api/player/search`
- `GET /api/player/lookup`
- `GET /api/oddset`
- `GET /api/players/odds/:playerA/:playerB`
- `GET /api/players/head-to-head/:playerA/:playerB`
- `GET /api/events/calendar`
- `POST /api/query`

`/api/ping` returns both `message` and backend `version`, which makes it useful for quick deploy verification.

Examples:

```bash
curl http://127.0.0.1:3004/ok
curl http://127.0.0.1:3004/api/ping
curl http://127.0.0.1:3004/api/matches/live
curl http://127.0.0.1:3004/api/player/rankings
curl "http://127.0.0.1:3004/api/player/rankings?top=25"
curl "http://127.0.0.1:3004/api/player/search?term=Borg"
curl "http://127.0.0.1:3004/api/player/lookup?query=Borg"
curl "http://127.0.0.1:3004/api/oddset"
curl "http://127.0.0.1:3004/api/oddset?raw=1"
curl "http://127.0.0.1:3004/api/players/odds/S0AG/A0E2"
curl "http://127.0.0.1:3004/api/players/odds/S0AG/A0E2?surface=Hard"
curl "http://127.0.0.1:3004/api/players/head-to-head/S0AG/A0E2?limit=5"
curl "http://127.0.0.1:3004/api/players/head-to-head/S0AG/A0E2?surface=Clay&limit=5"
curl http://127.0.0.1:3004/api/events/calendar
curl -X POST http://127.0.0.1:3004/api/query \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT 1"}'
```

### `/api/player/rankings` Query Parameters
- `top`: positive integer, defaults to `100`

### `/api/player/search` Query Parameters
- `term`: player search term

Notes:
- This endpoint goes directly to MariaDB with `CALL PLAYER_SEARCH(?)`.
- It returns the raw MariaDB procedure result from `CALL PLAYER_SEARCH(?)`.

### `/api/player/lookup` Query Parameters
- `query`: primary search term
- `term`: alias for `query`
- `searchTerm`: alias for `query`

Notes:
- This endpoint reads from the MariaDB `PLAYER_LOOKUP` function and then loads the resolved player row.
- It returns the raw MariaDB function result from `SELECT PLAYER_LOOKUP(...)`.

### `/api/oddset` Query Parameters
- `raw`: truthy value to return raw upstream payload bundle (`{ matches, open, upcoming, meta, errors }`)
- `requestTimeoutMs`: request timeout in milliseconds
- `url`: override upstream endpoint
- `matchesUrl`: override the primary ATP matches endpoint
- `openUrl`: override the live-open fallback endpoint
- `upcomingUrl`: override the tennis-all upcoming fallback endpoint

`/api/oddset` is the canonical Oddset endpoint for this project:
- it always returns the current ATP-family Oddset rows for both live and upcoming matches
- clients can filter on the returned `state` field when they only want live or only upcoming rows

### `/api/oddset` Upstream Fallback Order
- Primary: Oddset ATP `matches.json` for ATP live/upcoming odds.
- Live fallback: Oddset `event/live/open.json` for ATP live rows when ATP `matches.json` is empty/incomplete.
- Upcoming fallback: Oddset tennis-all `listView/tennis/all/all/all/matches.json` when ATP `matches.json` has no upcoming rows.
- All rows are filtered to the ATP family in code, not just by upstream URL naming:
  - `termKey === 'atp'`
  - `termKey.startsWith('atp_')`
- fallback name matching for ATP qualifier labels such as `ATP Qual.`
- Parsed response shape stays the same: an array of rows with `id`, `start`, `tournament`, `state`, `score`, `playerA`, `playerB`.

### `/api/players/odds/:playerA/:playerB` Query Parameters
- `surface`: optional surface selector (`Hard`, `Clay`, `Grass`)

Notes:
- `playerA` and `playerB` must be ATP player ids already present in the local database.
- The endpoint delegates to `CALL PLAYER_ODDS(?, ?, ?)` in MariaDB and returns a two-item array with decimal odds after a fixed 5% margin.
- Use `/api/player/lookup` or `/api/player/search` first if you need to resolve a name to an id.

### `/api/players/head-to-head/:playerA/:playerB` Query Parameters
- `surface`: optional surface filter
- `limit`: integer from `1` to `50`, defaults to `10`

Notes:
- `playerA` and `playerB` can be ids or names; the endpoint resolves them against the local player table.
- The response includes resolved player metadata, overall record, surface breakdown, and recent meetings.

## Data Sources Used in Code
- `https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank={top}`
- `https://www.atptour.com/en/-/www/activity/last/{player}`
- `https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear={eventYear}&eventid={eventID}`
- `https://www.atptour.com/en/-/www/players/hero/{player}`
- `https://www.atptour.com/en/-/www/StatsLeaderboard/{type}/52week/all/all/false?v=1`
- `https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/listView/tennis/atp/all/all/matches.json?channel_id=1&client_id=200&lang=sv_SE&market=SE&useCombined=true&useCombinedLive=true`
- `https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/event/live/open.json?lang=sv_SE&market=SE&client_id=200&channel_id=1`
- `https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/listView/tennis/all/all/all/matches.json?channel_id=1&client_id=200&lang=sv_SE&market=SE&useCombined=true&useCombinedLive=true`
- `https://www.atptour.com/en/-/tournaments/calendar/tour`

Reference docs:
- [Project Endpoints README](./endpoints/README.md)
- [Calendar JSON example](./endpoints/examples/tournaments.calendar.tour.example.json)

## Database Notes
- Schema in repo: `database/schema.sql`.
- Repo-managed SQL functions live in `database/functions/`.
- Repo-managed SQL procedures live in `database/procedures/`.
- The database layer currently relies on score helper functions (`NUMBER_OF_GAMES`, `NUMBER_OF_SETS`, `NUMBER_OF_TIE_BREAKS`) plus model-oriented functions such as `PLAYER_ELO_FACTOR`, `PLAYER_FORM_FACTOR`, `PLAYER_FATIGUE_FACTOR`, `PLAYER_ODDS_FACTOR`, `PLAYER_RANK_FACTOR`, and `PLAYER_HEAD_TO_HEAD_FACTOR`.
- Lookup helpers now also exist in MariaDB:
  - `PLAYER_LOOKUP(searchTerm)` returns the single best matching `players.id`
  - `CALL PLAYER_SEARCH(searchTerm)` returns up to 5 ranked candidate rows
- `PLAYER_SEARCH` currently ranks exact last-name matches ahead of generic prefix/contains matches, which helps names like `Borg` resolve before `Borges`.
- Those helper functions are kept for client-side statistical SQL queries and assume normalized score strings such as `6-4 7-6(5)`.
- The import pipeline does not call `sp_update()`; post-import updates are handled in application code.
- `node atp.js import ...` fails if required schema objects are missing.
- `/api/player/search` goes directly to MariaDB with `CALL PLAYER_SEARCH(?)` and returns the raw procedure result.
- `/api/player/lookup` goes directly to MariaDB with `SELECT PLAYER_LOOKUP(...)` and returns the raw function result.

## Security and Caveats (From Current Source)
- `POST /api/query` keeps `multipleStatements=true`, but now accepts read-only SQL only (`SELECT`, `WITH`, `SHOW`, `DESCRIBE`, `EXPLAIN`).
- Write/admin statements such as `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `SET`, and `CALL` are rejected with `400`.
- Keep the service private/trusted anyway, since `/api/query` still exposes broad read access to the database and cannot be used to execute repo-managed procedures such as `PLAYER_SEARCH`.

## Project Structure
- `atp.js` - CLI entrypoint
- `commands/` - command handlers
- `src/` - fetchers, parsers, DB/ELO logic
- `helpers/` - ad hoc maintenance scripts documented in `helpers/README.md`
- `database/` - SQL schema

## Collaboration
- Shared project memory and Codex instructions live in `CODEX.md`.
