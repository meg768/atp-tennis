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
- MariaDB user permissions that allow creating the tables, view, and helper functions defined in the schema.

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
- `import [options]` - Full import pipeline (rankings -> activity -> scores -> players -> stats -> ELO -> surface factors).
- `serve [options]` - Start local API server.

### Common Command Examples

```bash
node atp.js import --top 100 --since 2025
node atp.js serve
```

### Important Options
- `import`: `--top`, `--since`, `--clean`, `--loop` (hours; default `12`), `--light`.

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
- `GET /api/calendar`
- `POST /api/query`

Examples:

```bash
curl http://127.0.0.1:3004/ok
curl http://127.0.0.1:3004/api/ping
curl http://127.0.0.1:3004/api/live
curl http://127.0.0.1:3004/api/rankings
curl "http://127.0.0.1:3004/api/oddset?states=STARTED,NOT_STARTED"
curl http://127.0.0.1:3004/api/calendar
curl -X POST http://127.0.0.1:3004/api/query \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT 1"}'
```

### `/api/oddset` Query Parameters
- `states`: comma-separated values, e.g. `STARTED,NOT_STARTED`
- `raw`: truthy value to return raw upstream payload bundle (`{ matches, open, errors }`)
- `requestTimeoutMs`: request timeout in milliseconds
- `url`: override upstream endpoint

## Data Sources Used in Code
- `https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank={top}`
- `https://www.atptour.com/en/-/www/activity/last/{player}`
- `https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear={eventYear}&eventid={eventID}`
- `https://www.atptour.com/en/-/www/players/hero/{player}`
- `https://www.atptour.com/en/-/www/StatsLeaderboard/{type}/52week/all/all/false?v=1`
- `https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/listView/tennis/atp/all/all/matches.json?channel_id=1&client_id=200&lang=sv_SE&market=SE&useCombined=true&useCombinedLive=true`
- `https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/event/live/open.json?lang=sv_SE&market=SE&client_id=200&channel_id=1`
- `https://www.atptour.com/en/-/tournaments/calendar/tour`

Reference docs:
- [Project Endpoints README](./endpoints/README.md)
- [Calendar JSON example](./endpoints/examples/tournaments.calendar.tour.example.json)

## Database Notes
- Schema in repo: `database/schema.sql`.
- The schema currently defines the core tables, the `flatly` view, and the `NUMBER_OF_GAMES`, `NUMBER_OF_SETS`, and `NUMBER_OF_TIE_BREAKS` helper functions.
- Those helper functions are kept for client-side statistical SQL queries and assume normalized score strings such as `6-4 7-6(5)`.
- The import pipeline does not call `sp_update()`; post-import updates are handled in application code.
- `node atp.js import ...` fails if required schema objects are missing.

## Security and Caveats (From Current Source)
- `POST /api/query` runs SQL from request input and DB config enables `multipleStatements=true`. Keep service private/trusted.

## Project Structure
- `atp.js` - CLI entrypoint
- `commands/` - command handlers
- `src/` - fetchers, parsers, DB/ELO logic
- `database/` - SQL schema

## Collaboration
- Shared project memory lives in `CONTEXT.md`.
