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
node atp.js monitor --interval 30
node atp.js update-stats
node atp.js update-elo
node atp.js update-players
node atp.js score-parser --examples
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
- `GET /api/oddset`
- `GET /api/calendar`
- `POST /api/query`

`/api/query` executes SQL directly against the database and should only be exposed in a trusted network.

Examples:

```bash
curl http://127.0.0.1:3004/ok
curl http://127.0.0.1:3004/api/ping
curl http://127.0.0.1:3004/api/rankings
curl "http://127.0.0.1:3004/api/oddset?states=STARTED,NOT_STARTED"
curl http://127.0.0.1:3004/api/calendar
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
- `https://www.atptour.com/en/-/tournaments/calendar/tour`

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
- `score-parser` is available as a standalone CLI test bench for developing `src/score-parser.js` without coupling it to import/ELO flows

## Priority Backlog
1. Critical: unauthenticated SQL execution via `/api/query` with `multipleStatements=true`
2. High: ELO calculation uses `^` (bitwise XOR) where exponentiation is expected
3. High: async race in `update-elo` / `update-stats` (missing `await` on connect/disconnect)
4. High: potential null dereference in live score parsing
5. Medium: `live --debug` ignores debug input data
6. Medium: `update-players` calls `this.log` without implementation
7. Medium: possible naming conflict in SQL surface-factor procedure

## Session Memory (2026-02-26)
- Live monitoring command is `monitor` (`commands/monitor.js`, registered in `atp.js`).
- `monitor` default source is ATP live URL:
  - `https://app.atptour.com/api/v2/gateway/livematches/website?scoringTournamentLevel=tour`
- `monitor` current primary behavior:
  - Polls live singles matches.
  - Prints only ongoing matches (`MatchStatus = P`) to console.
  - Output format: `Event | Round | Player vs Opponent | score`.
- `monitor` options currently include:
  - `--interval`.
- `monitor` now fetches live payload through `src/fetch-live.js`.
- `monitor` no longer parses raw endpoint JSON directly; it consumes normalized rows from `fetch-live.parse()`.
- `monitor` now opens DB itself and enriches each row with `player.rank` / `opponent.rank` from `players.rank`.
- `monitor` connects to DB once at startup and enriches rows with rank while running.
- Rank enrichment in `monitor` uses `getPlayerRank(id)` with an in-memory cache (no batched `IN (...)` query path).
- Wins/losses enrichment in `monitor` uses head-to-head lookup from `matches` with cached pair keys in `updateEventWithWinsAndLosses()`.
- `updateEventWithWinsAndLosses()` cache access was fixed to use module scope (no `this` leakage inside inner function).
- `alert` command was removed from CLI registration; `monitor` is the maintained path.
- `live` command was extended with polling support:
  - `--poll`, `--interval`, `--max`, `--changes-only`.
  - It now supports real polling output and debug input in the same execution flow.
- Live parser hardening applied in `src/fetch-live.js`:
  - Guard added for set score parsing (`pA && pB`) to avoid null dereference.
- `src/fetch-live.js` now includes team seed in parsed player objects:
  - `row.player.seed` and `row.opponent.seed`.
- `src/fetch-live.js` game-point parsing now reads team-level fields:
  - `row.game` as combined game state string from team game scores (e.g. `30-30`, `40-0`, `A-40`).
  - When `MatchStatus = P`, `row.score` appends current game state in brackets (e.g. `6-1 6-2 [0-40]`).
- `src/fetch-live.js` doubles filter uses `match.IsDoubles` (API field name).

## Session Memory (2026-03-01)
- Import flow now has a separate rankings sync step in `commands/import.js`:
  - `getTopPlayerRankings(top)` fetches rankings once.
  - `updateRankings(rankings)` now clears only `players.points`, then restores `rank` and `points` for players in the fetched ranking list.
  - This preserves `players.rank` values fetched per player during import, so imported players outside the requested top list do not lose their ranking.
- `src/fetch-rankings.js` now respects the requested `top` value instead of always fetching top 100.
- `src/fetch-scores.js` now derives `matches.status` from ATP archive fields (`Status`, `MatchStateReasonMessage`, `Message`, `ResultString`) and import persists that status into `matches.status`.
- `database/schema.sql` `sp_update_match_status` was updated to stop depending on missing SQL functions (`IS_MATCH_COMPLETED`, `NUMBER_OF_SETS_PLAYED`) and now:
  - preserves already known statuses (`Completed`, `Aborted`, `Walkover`)
  - uses `score` as fallback to derive `Walkover` / `Aborted` / `Completed`
- User reported a 2026 import run looked good after these changes.

## Session Memory (2026-03-12)
- New module added: `src/fetch-oddset.js`.
- Purpose: fetch ATP match odds from Kambi/Svenska Spel endpoint:
  - `https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/listView/tennis/atp/all/all/matches.json?channel_id=1&client_id=200&lang=sv_SE&market=SE&useCombined=true&useCombinedLive=true`
- Parser filters by event state (`STARTED`, `NOT_STARTED` by default), sorts by start time, and maps rows to:
  - `start`, `tournament`, `score`, `playerA{name, odds}`, `playerB{name, odds}`
- Module includes request timeout handling (`AbortController`) and explicit error messages for fetch/HTTP/JSON failures.
- `serve` command now exposes endpoint `GET /api/oddset` using this module.
- Module now follows project fetcher pattern:
  - inherits from `src/fetcher.js`
  - exports via CommonJS (`module.exports`)
- Endpoint reference folder renamed from `atp-endpoints/` to `endpoints/`, and `endpoints/README.md` now includes the Oddset endpoint.
- New module added: `src/fetch-calendar.js`.
  - Purpose: fetch ATP tournament calendar from:
    - `https://www.atptour.com/en/-/tournaments/calendar/tour`
  - Current behavior:
    - `fetch()` returns raw passthrough JSON from endpoint.
    - `parse(payload)` is an instance method (not static) that currently returns:
      - `{ events: [{ id, name, date, location, type }] }`
      - `id` format is `YYYY-Id` based on `TournamentDates[].DisplayDate` year (fallback: original `Id` if year is missing).
- `serve` command now exposes endpoint `GET /api/calendar` (returns parsed `{ events: [...] }`).
- New test area added: `sandbox/`.
  - `sandbox/fetch-calendar.js` runs `fetch-calendar` with no parameters.
  - It always writes:
    - `sandbox/output/fetch-calendar.parsed.json`
    - `sandbox/output/fetch-calendar.raw.json`
  - `sandbox/README.md` documents the simplified sandbox flow.
  - Team convention: sandbox-specific iteration notes belong in `sandbox/README.md`, not top-level `LOG.md`.

## Collaboration Notes
- `CONTEXT.md` is the shared source of truth for project context and memory
- Update this file when operational details, architecture, or priorities change
- `LOG.md` is the running change log for repository edits; append new entries as changes are made
- Commit command policy (user shorthand):
  - When the user says `commit`, interpret it as: stage all + commit + push.
  - Standard sequence:
    - `git add -A`
    - generate an automatic concise commit message from current changes
    - `git commit -m "..."`
    - `git push origin <current-branch>`
  - Defaults:
    - remote: `origin`
    - branch: current checked-out branch
    - no force push by default
    - no automatic merge/rebase by default
  - Error handling:
    - if there are no changes: report a clear no-op (`nothing to commit`)
    - if commit fails: report the concrete git error
    - if push fails with non-fast-forward: stop and ask user before any rebase/merge/force action
    - if push fails for auth/network/remote reasons: report the concrete git error and stop
  - Success confirmation after push:
    - report commit hash, branch, and push target (`origin/<branch>`)
