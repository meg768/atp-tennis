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
node atp.js serve
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
- Legacy `import` no longer calls `sp_update()`; surface factors are now updated in app code via `src/update-surface-factors.js`
- Legacy `import` ELO now reads directly from `matches` + `events` and does not depend on the `flatly` view
- `database/schema.sql` is now a dump of the current MariaDB schema and currently includes:
  - tables: `events`, `log`, `matches`, `players`, `settings`
  - view: `flatly`
  - helper SQL functions: `NUMBER_OF_GAMES`, `NUMBER_OF_SETS`, `NUMBER_OF_TIE_BREAKS`
  - no `sp_update*` stored procedures

## MariaDB Prerequisites

Before running a full import, MariaDB must already contain:
- Tables/views from `database/schema.sql`

Failure behavior:
- `node atp.js import ...` fails with a MariaDB error if required schema tables are missing

## Environment Bootstrap Note

For fresh dev/prod environments:
1. Create tables/views from `database/schema.sql`

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
- CLI has been minimized to `import` and `serve`
- endpoint/fetch testing is expected to happen under `sandbox/`

## Priority Backlog
1. Critical: unauthenticated SQL execution via `/api/query` with `multipleStatements=true`
2. High: ELO calculation uses `^` (bitwise XOR) where exponentiation is expected
3. High: potential null dereference in live score parsing
4. Medium: possible naming conflict in SQL surface-factor procedure

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
- `src/fetch-top-players.js` now respects the requested `top` value instead of always fetching top 100.
- `src/fetch-archive.js` now derives `matches.status` from ATP archive fields (`Status`, `MatchStateReasonMessage`, `Message`, `ResultString`) and import persists that status into `matches.status`.
- User reported a 2026 import run looked good after these changes.

## Session Memory (2026-03-15)
- `database/schema.sql` was refreshed from the live `atp` database as a Sequel Pro dump.
- The checked-in schema no longer includes legacy `sp_update*` stored procedures.
- `NUMBER_OF_GAMES`, `NUMBER_OF_SETS`, and `NUMBER_OF_TIE_BREAKS` are still expected to exist in MariaDB for client-side statistical queries.
- Those helper functions were simplified to assume normalized `score` values such as `6-4 7-6(5)`.
- README and context were updated to describe the current import flow accurately:
  - post-import updates run in JS modules, not via `sp_update()`
  - `import --loop` is documented in hours with default `12`
  - `import --light` is documented as a supported option

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
    - `parse(raw)` is an instance method (not static) that currently returns:
      - `{ events: [{ id, name, date, location, type }] }`
      - `id` format is `YYYY-Id` based on `TournamentDates[].DisplayDate` year (fallback: original `Id` if year is missing).
- `serve` command now exposes endpoint `GET /api/calendar` (returns parsed `{ events: [...] }`).
- New test area added: `sandbox/`.
  - `sandbox/fetch-calendar.js` runs `fetch-calendar` with no parameters.
  - `sandbox/fetch-oddset.js` runs `fetch-oddset` with default states (`STARTED`, `NOT_STARTED`).
  - It always writes:
    - `sandbox/output/fetch-calendar.parsed.json`
    - `sandbox/output/fetch-calendar.raw.json`
    - `sandbox/output/fetch-oddset.parsed.json`
    - `sandbox/output/fetch-oddset.raw.json`
  - `sandbox/README.md` documents the simplified sandbox flow.
  - Team convention: sandbox-specific iteration notes belong in `sandbox/README.md`, not top-level `LOG.md`.
- CLI command registration in `atp.js` has been trimmed further:
  - `import`, `serve`
  - all other command files were removed; sandbox is now the place for endpoint/debug testing
- Import identity strategy decision:
  - `fetch-activity` is for recursive player/event discovery only (graph traversal back in time).
  - canonical `matches.id` should come from ATP archive scores only: `{eventYear}-{eventId}-{matchId}`.

## Session Memory (2026-03-14)
- Legacy ATP import flow in `commands/import.js` was refactored further around real ATP match identity:
  - canonical `matches.id` is now intended to be `{eventYear}-{eventId}-{matchId}`
  - `src/fetch-activity.js` now uses DB-style `id` naming for activity rows (`event.id`, `match.id`)
  - `src/fetch-archive.js` is the renamed former `src/fetch-scores.js`
  - `src/fetch-archive.js` now also owns archive-side score and duration normalization
- Current import design in `commands/import.js`:
  - `discoverEvents()` recursively traverses ATP activity
  - activity is used for discovery plus enrichment of match-time `winner_rank` / `loser_rank`
  - archive remains the authoritative source for persisted match rows
  - activity enrichment is keyed by full `match.id`
- Discovery/traversal state in the legacy import:
  - `discoverEvents()` currently accepts a shared `cache` object from `import()`
  - this is intentionally used to dedupe discovery across the full top-player loop
  - the recursive implementation detail is now a local inner function `discover()`
- The earlier synthetic winner/loser-based match IDs in the legacy import were replaced by ATP-based IDs.
- Sandbox/testing updates:
  - `sandbox/fetch-archive.js` replaces the old `sandbox/fetch-scores.js`
  - new script added: `sandbox/fetch-player.js`
  - sandbox scripts are intended to be executable directly
- Runtime verification:
  - a real legacy import with `--since 2020` completed successfully
  - reported runtime was about 65 minutes
  - user considers `--since 2020` the practical target dataset; pre-2020 / Open Era imports are optional fun-history work rather than a requirement
- An earlier proof-of-concept import path was removed again after its ideas were folded back into the maintained legacy import path.
- Additional hardening was applied to `commands/import.js`:
  - import now aborts before ranking updates if the fetched ranking list is empty, preventing a mass `players.points = NULL` write on bad ATP responses
  - activity discovery now logs and skips per-player fetch failures instead of aborting the whole run immediately
  - MySQL disconnect is now awaited in `finally`, so failed imports still close the connection cleanly
  - `--loop` in legacy `import` now means hours between runs, with default `12`
  - new `--light` mode forces a minimal import: current year only and `top=1`
  - progress logging now handles small/empty batches without relying on `Math.floor(array.length / 10)`
  - repeated import phases are now funneled through shared helpers (`processItems()`, `fetchScores()`, `saveRows()`, `updatePlayerDetails()`) to keep the legacy flow easier to maintain
  - most import-specific helper functions now live locally inside `commands/import.js` `run()` for readability, instead of as class methods
  - surface factor calculation was moved out of `commands/import.js` into `src/update-surface-factors.js`, keeping the command file thinner
  - ELO execution is now also called through a thin module wrapper in `src/update-elo.js`, so `commands/import.js` only orchestrates
  - `src/update-elo.js` now assumes scores in DB are already normalized (`6-4 7-6(5)` style) and filters mainly on `status = 'Completed'`
  - ATP player stats sync is now also moved to `src/update-player-stats.js`, continuing the same thin-command pattern
  - ranking sync is now also moved to `src/update-rankings.js`, further shrinking `commands/import.js`
  - update modules now share a consistent constructor shape with injected dependencies such as `mysql` and `log`
  - code style preference: keep helper functions local to the method/block that uses them whenever practical, instead of promoting small helpers to file scope
  - code style preference: keep function parameter lists on one line when practical

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
