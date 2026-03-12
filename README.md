# ATP Tennis

Node.js (CommonJS) app that imports ATP data into MariaDB, updates player metrics (stats + ELO), and exposes a local API for live and ranking data.

## What It Does
- Imports rankings, activity, event results, and player details from ATP endpoints.
- Stores/upserts data in MariaDB tables (`events`, `matches`, `players`, etc.).
- Updates `serve/return/pressure` ratings and ELO.
- Exposes HTTP endpoints via `node atp.js serve`.

## Requirements
- Node.js 20+ (built-in `fetch` is used in multiple modules).
- MariaDB with schema from `database/schema.sql`.
- Stored procedures/functions required by your install, including `sp_update`.

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

## CLI

Show all commands:

```bash
node atp.js --help
```

Available commands (from `atp.js`):
- `import [options]` - Full import pipeline (rankings -> activity -> scores -> players -> stats -> ELO -> `sp_update()`).
- `rankings [options]` - Fetch rankings to JSON.
- `live [options]` - Fetch/poll ATP live matches and write `output/live.json`.
- `monitor [options]` - Poll live matches, enrich with DB rank + head-to-head, print JSON snapshots.
- `scores [options]` - Fetch one event archive.
- `player [options]` - Fetch one player profile.
- `activity [options]` - Fetch one player's activity history.
- `stats [options]` - Fetch ATP leaderboard-derived ratings.
- `update-stats [options]` - Write ratings into `players`.
- `update-elo [options]` - Recompute and write ELO into `players.elo_rank`.
- `update-players [options]` - Backfill missing birthdates.
- `score-parser [scores..]` - Score parser test bench.
- `events [options]` - Internal/debug helper.
- `serve [options]` - Start local API server.

### Common Command Examples

```bash
node atp.js import --top 100 --since 2025
node atp.js rankings --top 50 --output ./output/rankings.json
node atp.js live --poll --interval 30 --max 10 --changes-only
node atp.js monitor --interval 15
node atp.js scores --event 2024-0339
node atp.js player --player S0AG
node atp.js activity --player R0DG --since 2020
node atp.js score-parser --examples --json
```

### Important Options
- `import`: `--top`, `--since`, `--clean`, `--loop` (days; default `0.33`).
- `live`: `--poll`, `--interval`, `--max`, `--changes-only`, `--debug`, `--input`, `--output`.
- `monitor`: `--interval` only.
- `rankings`: `--top`, `--output`.
- `scores`: `--event`, `--output`.
- `player` / `activity`: `--player`, `--output` (+ `activity --since`).

## API Service

Start:

```bash
node atp.js serve
```

Bind address: `127.0.0.1:3004`

Endpoints (from `commands/serve.js`):
- `GET /ok`
- `GET /api/ping`
- `GET /api/live`
- `GET /api/rankings`
- `GET /api/oddset`
- `POST /api/query`

Examples:

```bash
curl http://127.0.0.1:3004/ok
curl http://127.0.0.1:3004/api/ping
curl http://127.0.0.1:3004/api/live
curl http://127.0.0.1:3004/api/rankings
curl "http://127.0.0.1:3004/api/oddset?states=STARTED,NOT_STARTED"
curl -X POST http://127.0.0.1:3004/api/query \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT 1"}'
```

### `/api/oddset` Query Parameters
- `states`: comma-separated values, e.g. `STARTED,NOT_STARTED`
- `raw`: truthy value to return raw upstream payload
- `requestTimeoutMs`: request timeout in milliseconds
- `url`: override upstream endpoint

## Data Sources Used in Code
- `https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank={top}`
- `https://www.atptour.com/en/-/www/activity/last/{player}`
- `https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear={eventYear}&eventid={eventID}`
- `https://www.atptour.com/en/-/www/players/hero/{player}`
- `https://www.atptour.com/en/-/www/StatsLeaderboard/{type}/52week/all/all/false?v=1`
- `https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour`
- `https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/listView/tennis/atp/all/all/matches.json?channel_id=1&client_id=200&lang=sv_SE&market=SE&useCombined=true&useCombinedLive=true`

Reference docs:
- [ATP Endpoints README](./atp-endpoints/README.md)
- [Calendar JSON example](./atp-endpoints/examples/tournaments.calendar.tour.example.json)

## Database Notes
- Schema in repo: `database/schema.sql`.
- Import pipeline expects `sp_update` and its dependencies to exist in MariaDB.
- `node atp.js import ...` fails if required routines/functions are missing.

## Security and Caveats (From Current Source)
- `POST /api/query` runs SQL from request input and DB config enables `multipleStatements=true`. Keep service private/trusted.
- `update-stats` does not `await` DB connect/disconnect (`commands/update-stats.js`).
- `update-players` catches errors with `this.log(...)` but command has no `log` method (`commands/update-players.js`).
- `events` command is a hardcoded helper (`eventid=403`) rather than a general CLI.

## Project Structure
- `atp.js` - CLI entrypoint
- `commands/` - command handlers
- `src/` - fetchers, parsers, DB/ELO logic
- `database/` - SQL schema

## Collaboration
- Shared project memory lives in `CONTEXT.md`.
