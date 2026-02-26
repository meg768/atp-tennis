# ATP Tennis

Node.js project for fetching ATP data from `atptour.com`, storing it in MariaDB, and exposing data through CLI commands and a local API service.

## What This Project Does
- Imports rankings, activity, match results, and player details from ATP endpoints
- Stores and updates data in MariaDB (`events`, `matches`, `players`, etc.)
- Updates player stats (serve/return/pressure) and ELO ratings
- Exposes a lightweight API via the `serve` command

## Tech Stack
- Node.js (CommonJS)
- MariaDB (via MySQL-compatible `mysql` package)
- Express 5
- `yargs` for CLI commands

## Environment Variables (`.env`)

```env
MYSQL_HOST=
MYSQL_USER=
MYSQL_PORT=
MYSQL_PASSWORD=
MYSQL_DATABASE=
```

Note: variable names use the `MYSQL_` prefix for compatibility, but the target database is MariaDB.

## Install

```bash
npm install
```

## Run CLI Commands

Show all commands:

```bash
node atp.js --help
```

Examples:

```bash
node atp.js import --top 100 --since 2025
node atp.js rankings --output ./output/rankings.json
node atp.js live --output ./output/live.json
node atp.js live --poll --interval 30 --changes-only
node atp.js monitor --interval 30
node atp.js monitor --max-checks 1
node atp.js update-stats
node atp.js update-elo
node atp.js update-players
```

## Monitor (`monitor`)

`monitor` watches ATP live singles matches and logs ongoing matches to console.

Default data source:
- `https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour`

Current output format:
- `Event | Round | Player vs Opponent | score`

Current behavior:
- Prints only matches with live status `P` (ongoing)
- Skips finished and not-started matches

Useful options:
- `--interval` polling interval in seconds
- `--max-checks` stop after N polling cycles (`0` = unlimited)

Examples:

```bash
# Run continuously
node atp.js monitor

# Faster polling
node atp.js monitor --interval 10

# Run one cycle only
node atp.js monitor --max-checks 1

```

## Start API Service

```bash
node atp.js serve
```

The service listens on `127.0.0.1:3004` (localhost).

### API Endpoints
- `GET /ok`
- `GET /api/ping`
- `GET /api/live`
- `GET /api/rankings`
- `POST /api/query`

`/api/query` executes SQL directly against the database and should only be exposed in a trusted network.

Examples:

```bash
curl http://127.0.0.1:3004/ok
curl http://127.0.0.1:3004/api/ping
curl http://127.0.0.1:3004/api/rankings
curl -X POST http://127.0.0.1:3004/api/query \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT 1"}'
```

## ATP Endpoints Used in Code

This is a deduplicated list from the current codebase.

### Actively Used (import/commands/serve)
- `https://app.atptour.com/api/gateway/rankings.ranksglrollrange?fromRank=1&toRank=100`
- `https://www.atptour.com/en/-/www/activity/last/{player}`
- `https://app.atptour.com/api/gateway/scores.resultsarchive?eventyear={eventYear}&eventid={eventID}`
- `https://www.atptour.com/en/-/www/players/hero/{player}`
- `https://www.atptour.com/en/-/www/StatsLeaderboard/{type}/52week/all/all/false?v=1`
- `https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour`

### Other ATP References in Repo
- `https://www.atptour.com/-/tournaments/explore/1000` (in `src/fetch-upcoming-events.js`)
- `https://www.atptour.com{ScRelativeUrlPlayerProfile}` (built from API response)
- `http://atptour.com{TournamentUrl}` (built from API response)
- `https://www.atptour.com/en/~/media/images/flags/{COUNTRY}.svg` (flags, `helpers/fetch-flags.js`)

## Database
- Repo-managed DB artifact: `database/schema.sql` (only)
- Runtime-required procedures/functions are managed directly in MariaDB (not versioned in this repo)
- The import flow calls `sp_update()` after data ingestion

## MariaDB Prerequisites

Before running a full import, MariaDB must already contain:
- `sp_update`
- Any routines/functions that `sp_update` depends on in your installation
  - Common examples: `sp_log`, `sp_update_surface_factors`, `sp_update_match_status`, and helper SQL functions used by those procedures

Failure behavior:
- `node atp.js import ...` fails with a MariaDB error if `sp_update` (or required dependencies) is missing

## Environment Bootstrap Note

For fresh dev/prod environments:
1. Create tables/views from `database/schema.sql`
2. Provision required routines/functions directly in MariaDB
3. Run the first full import only after step 2 is complete

## Project Structure
- `atp.js` - CLI entrypoint
- `commands/` - CLI commands
- `src/` - fetchers, MySQL layer, ELO, helper modules
- `database/` - schema (`database/schema.sql`)

## Current Status
- Chat/OpenAI endpoint has been removed
- Bob-related files have been removed

## Operational Context
- `atp.js` is used for daily imports from ATP endpoints
- Primary production concern is keeping the import pipeline stable
- `monitor` is used for lightweight live score monitoring from ATP live endpoint

## Priority Backlog
1. Critical: unauthenticated SQL execution via `/api/query` with `multipleStatements=true`
2. High: ELO calculation uses `^` (bitwise XOR) where exponentiation is expected
3. High: async race in `update-elo` / `update-stats` (missing `await` on connect/disconnect)
4. High: potential null dereference in live score parsing
5. Medium: `fetch-rankings` ignores `top` and does null checks too late
6. Medium: `update-players` calls `this.log` without implementation
7. Medium: possible naming conflict in SQL surface-factor procedure

## Collaboration Notes
- `CONTEXT.md` is the shared source of truth for project context and memory
- Update `CONTEXT.md` when operational details, architecture, or priorities change
