# ATP Tennis

Node.js (CommonJS) app that imports ATP data into MariaDB, updates player metrics (stats + ELO), and exposes a local API for live and ranking data.

## What It Does
- Imports rankings, activity, event results, and player details from ATP endpoints.
- Stores/upserts data in MariaDB tables (`events`, `matches`, `players`, etc.).
- Updates `serve/return/pressure` ratings and ELO.
- Exposes HTTP endpoints via `node atp.js serve`.

## Requirements
- Node.js 20+ (built-in `fetch` is used in multiple modules).
- MariaDB with the complete structure from `database/schema.sql`.
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

Apply `database/schema.sql`. It is a structure-only dump that creates the
database, tables, view, functions, and procedures without application data.

The app expects those objects to already exist before you run `import` or `serve`.

## CLI

Show all commands:

```bash
node atp.js --help
```

Available commands (from `atp.js`):
- `import [options]` - Full import pipeline (rankings -> activity -> scores -> players -> stats -> Tennis Abstract ELO -> surface factors).
- `serve [options]` - Start local API server.

### Common Command Examples

```bash
node atp.js import --top 100 --since 2025
node atp.js import --elo-only
node atp.js serve
```

### Important Options
- `import`: `--top`, `--since`, `--clean`, `--loop` (hours; default `12`), `--light`, `--elo-only`.

`--elo-only` skips the ATP match import and replaces the four player ELO fields
with current overall, Hard, Clay, and Grass ratings from Tennis Abstract. The
report is downloaded and parsed before the database is changed. The database
update is transactional: all existing ELO values are first set to `NULL`, then
matched players are populated. Players absent from the report remain `NULL`.

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
- `GET /api/meta/schema.sql`
- `GET /api/meta/endpoints`
- `GET /api/flags/:code.svg`
  Missing assets return a neutral white fallback flag SVG instead of a 404.
- `GET /api/matches/live`
- `GET /api/player/rankings`
- `GET /api/player/search`
- `GET /api/player/lookup`
- `GET /api/oddset`
- `GET /api/odds`
- `POST /api/odds/matches`
- `GET /api/events/calendar`
- `POST /api/query`

`/api/ping` returns both `message` and backend `version`, which makes it useful for quick deploy verification.

Examples:

```bash
curl http://127.0.0.1:3004/ok
curl http://127.0.0.1:3004/api/ping
curl http://127.0.0.1:3004/api/meta/schema.sql
curl http://127.0.0.1:3004/api/meta/endpoints
curl http://127.0.0.1:3004/api/flags/ITA.svg
curl http://127.0.0.1:3004/api/matches/live
curl http://127.0.0.1:3004/api/player/rankings
curl "http://127.0.0.1:3004/api/player/rankings?top=25"
curl "http://127.0.0.1:3004/api/player/search?term=Borg"
curl "http://127.0.0.1:3004/api/player/lookup?query=Borg"
curl "http://127.0.0.1:3004/api/oddset"
curl "http://127.0.0.1:3004/api/oddset?raw=1"
curl "http://127.0.0.1:3004/api/odds?playerA=S0AG&playerB=A0E2"
curl "http://127.0.0.1:3004/api/odds?playerA=Jannik%20Sinner&playerB=Alexander%20Bublik&surface=Hard"
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
- it returns Kambi/Oddset data and resolved ATP player ids only; GPT and Tennis Abstract odds remain owned by `/api/odds` and `/api/odds/matches`
- player ids for all unique names in a feed are resolved through one bulk MariaDB query

### `/api/oddset` Upstream Sources
- Primary: Oddset ATP `matches.json` for ATP live/upcoming odds.
- Live supplement: Oddset `event/live/open.json` for ATP live rows when ATP `matches.json` is empty/incomplete.
- Upcoming supplement: Oddset tennis-all `listView/tennis/all/all/all/matches.json`, because Grand Slam rows can be missing from the ATP-specific endpoint even when other ATP upcoming rows exist.
- All rows are filtered to the ATP family in code, not just by upstream URL naming:
  - `termKey === 'atp'`
  - men's Grand Slam rows
- ATP qualifiers (`qual`/`kval`) are excluded.
- Parsed response shape stays the same: an array of rows with `id`, `start`, `tournament`, `state`, `score`, `playerA`, `playerB`.
- Each nested player object now also includes resolved ATP `id` when available.

Notes:
- `playerA` and `playerB` can be ATP ids or free-text player names.
- The endpoint resolves both players locally, finds the matching row in the normalized Oddset feed, and returns a two-item array with Svenska Spels decimal odds.
- Index `0` is `playerA` odds and index `1` is `playerB` odds.

### `/api/odds` Query Parameters
- `playerA`: required ATP player id or player name
- `playerB`: required ATP player id or player name
- `surface`: optional surface selector (`Hard`, `Clay`, `Grass`)

Notes:
- `playerA` and `playerB` can be ATP player ids or free-text player names.
- The endpoint returns `{ "odds": { "TA": [...], "GPT": [...] } }` from one `CALL PLAYER_ODDS(?, ?, ?)`.
- MariaDB owns both models, probability-to-odds conversion, and the 5% pricing margin. `atp-service` only validates transport input and shapes JSON.
- The service does not contact Tennis Abstract at request time; the daily import is solely responsible for refreshing stored Elo ratings.
- `WIN_PROBABILITY_TA(...)` is the pure overall/surface Elo model.
- `WIN_PROBABILITY_GPT(...)` is the weighted model using stored TA Elo, ranking, and form.

### `/api/odds/matches`

Accepts a JSON body with a `matches` array of up to 100 matchups. Each entry contains a client-provided `key`, `playerA`, `playerB`, and optional `surface`. The response contains one row per matchup with the same key, `odds.TA`, `odds.GPT`, and an individual `error` value. One invalid matchup does not fail the complete batch.

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
- `database/schema.sql` is the single repo-managed source for tables, views, functions, and procedures.
- The database layer owns both odds models through `WIN_PROBABILITY_TA(...)`, `WIN_PROBABILITY_GPT(...)`, and `PLAYER_ODDS(...)`.
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
