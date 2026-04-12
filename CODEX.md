# CODEX

This file is the single source of truth for Codex instructions, project context, and session memory in this repository.

When updating project memory, architecture notes, operational details, priorities, or collaboration conventions, update this file directly.

## ATP Tennis

Node.js project for fetching ATP data from `atptour.com`, storing it in MariaDB, and exposing data through CLI commands and a local API service.

## Cross-Repo Context
- The frontend for this backend lives in the sibling repository `../vitel`.
- The MCP bridge for this backend lives in the sibling repository `../atp-tennis-mcp`.
- `atp-tennis` is the canonical backend for `vitel` in local development and project discussions unless explicitly stated otherwise.
- Oddset ownership lives here: frontend clients should consume Oddset data through `GET /api/oddset` instead of calling Kambi/Svenska Spel directly.
- This Codex thread is now treated as the main shared conversation across `atp-tennis`, `atp-tennis-mcp`, and `vitel`. Cross-repo changes can be coordinated from here.

## What This Project Does
- Imports rankings, activity, match results, and player details from ATP endpoints
- Stores and updates data in MariaDB (`events`, `matches`, `players`, etc.)
- Updates player stats (serve/return/pressure) and ELO ratings
- Exposes a lightweight API via the `serve` command

## Domain Context
- Primary tennis data focus is the Open Era (`1968-present`).
- Older historical data can exist, but it is lower priority than the modern ATP dataset.
- Core database entities are:
  - `players`
  - `matches`
  - `events`
- Important analysis view:
  - `flatly`
- `flatly` is treated as a convenience join layer for analysis and downstream SQL, even when some import/runtime code paths no longer depend on it directly.

## Website And Query Context
- The broader ATP statistics site around this project includes pages such as:
  - `/query`
  - `/events`
  - `/live`
  - `/currently`
  - `/head-to-head`
- SQL queries are stored as files with metadata headers (title, description, SQL) and are loaded into the web app automatically.
- SQL results may be rendered directly in the UI.
- The React/UI side uses project-specific components such as:
  - `Page`
  - `Page.Menu`
  - `Page.Content`
  - `Table`
- The wider project also includes a `MarkdownProcessor` concept that finds SQL blocks in markdown, executes them, and injects markdown tables.

## ATP Reverse Engineering Context
- Endpoint exploration is an active part of the project, especially around:
  - tournament endpoints
  - results archive endpoints
  - draw endpoints
  - player entry lists
- Example discovered ATP endpoint pattern:
  - `https://www.atptour.com/-/ls/playerdrawpath/grouped/{year}/{eventId}/{playerId}`

## Import And Operations Context
- A representative full import command is:
  - `./atp.js import --since 1968 --clean`
- The import tool is expected to:
  - fetch ATP data
  - import into MariaDB
  - apply retry logic on failures
  - log progress clearly
- Example remote log monitoring command used in this project context:
  - `ssh pi@pi-kato "tail -f /home/pi/atp-tennis/import.log"`

## Database Conventions
- Database column names should be in English.
- User-facing UI labels should be in Swedish with an initial capital letter.
- The wider MariaDB environment may contain additional custom helper functions beyond those checked into `database/schema.sql`, for example:
  - `NUMBER_OF_SETS_PLAYED(score)`

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

## Helper Scripts

Manual maintenance scripts are documented in `helpers/README.md`.

## Start API Service

```bash
node atp.js serve
```

The service listens on `127.0.0.1:3004` (localhost).

### API Endpoints
- `GET /ok`
- `GET /api/ping`
- `GET /api/matches/live`
- `GET /api/player/rankings`
- `GET /api/player/search`
- `GET /api/player/lookup`
- `GET /api/oddset`
- `GET /api/players/odds/:playerA/:playerB`
- `GET /api/events/calendar`
- `POST /api/query`

`/api/query` allows read-only SQL only and should still only be exposed in a trusted network.
`/api/ping` returns both `message` and backend `version`, which makes it useful for quick deploy verification.

Examples:

```bash
curl http://127.0.0.1:3004/ok
curl http://127.0.0.1:3004/api/ping
curl http://127.0.0.1:3004/api/player/rankings
curl "http://127.0.0.1:3004/api/oddset?states=STARTED"
curl "http://127.0.0.1:3004/api/oddset?states=STARTED,NOT_STARTED"
curl http://127.0.0.1:3004/api/events/calendar
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
- Repo-managed DB artifacts:
  - `database/schema.sql`
  - `database/functions/*.sql`
  - `database/procedures/*.sql`
- Legacy `import` no longer calls `sp_update()`; surface factors are now updated in app code via `src/update-surface-factors.js`
- Legacy `import` ELO now reads directly from `matches` + `events` and does not depend on the `flatly` view
- `database/schema.sql` is now a dump of the current MariaDB schema and currently includes:
  - tables: `events`, `log`, `matches`, `players`, `settings`
  - view: `flatly`
  - helper SQL functions: `NUMBER_OF_GAMES`, `NUMBER_OF_SETS`, `NUMBER_OF_TIE_BREAKS`, `PLAYER_LOOKUP`
  - stored procedure: `PLAYER_SEARCH`
  - no legacy `sp_update*` stored procedures

## MariaDB Prerequisites

Before running a full import, MariaDB must already contain:
- Tables/views from `database/schema.sql`
- Repo-managed functions from `database/functions/`
- Repo-managed procedures from `database/procedures/` when used

Failure behavior:
- `node atp.js import ...` fails with a MariaDB error if required schema tables are missing

## Environment Bootstrap Note

For fresh dev/prod environments:
1. Create tables/views from `database/schema.sql`
2. Apply SQL files from `database/functions/`
3. Apply SQL files from `database/procedures/` when needed

## Project Structure
- `atp.js` - CLI entrypoint
- `commands/` - CLI commands
- `src/` - fetchers, MySQL layer, ELO, helper modules
- `helpers/` - executable maintenance scripts documented in `helpers/README.md`
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
1. Important: `/api/query` is now read-only, but still provides broad unauthenticated database read access on a trusted network

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

## Session Memory (2026-03-12)

## Session Memory (2026-03-30)
- New backend player endpoints are now the preferred path:
  - `GET /api/player/search?term=...` returns the raw MariaDB result from `CALL PLAYER_SEARCH(?)`
  - `GET /api/player/lookup?term=...` returns the raw MariaDB result from `SELECT PLAYER_LOOKUP(?) AS id`
- Legacy `GET /api/search-player` has been removed from the backend in favor of the two endpoints above.
- `PLAYER_SEARCH` is the primary DB search primitive and returns up to 5 rows with `id`, `name`, `country`, `rank`, and `active`.
- `PLAYER_LOOKUP` is the scalar DB helper that returns the best matching player id.
- Hosted backend verification on `https://tennis.egelberg.se/` confirmed both `/api/player/search` and `/api/player/lookup` are now live and working after the server-side function update.
- `GET /api/ping` now returns both `message` and backend `version`.
- Backend version was bumped to `1.0.1`.
- `npm run restart-atp-service` was run successfully on `pi-kato`; `git pull` completed and PM2 shows `atp-service` online at version `1.0.1`.
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
- Team convention: sandbox-specific iteration notes belong in `sandbox/README.md`, not in the top-level change log section in `CODEX.md`.
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

## Session Memory (2026-03-15)
- `database/schema.sql` was refreshed from the live `atp` database as a Sequel Pro dump.
- The checked-in schema no longer includes legacy `sp_update*` stored procedures.
- `NUMBER_OF_GAMES`, `NUMBER_OF_SETS`, and `NUMBER_OF_TIE_BREAKS` are still expected to exist in MariaDB for client-side statistical queries.
- Those helper functions were simplified to assume normalized `score` values such as `6-4 7-6(5)`.
- README and project context were updated to describe the current import flow accurately:
  - post-import updates run in JS modules, not via `sp_update()`
  - `import --loop` is documented in hours with default `12`
  - `import --light` is documented as a supported option

## Session Memory (2026-03-16)
- `src/fetch-oddset.js` no longer relies only on Oddset ATP `matches.json`.
- `/api/oddset` now merges up to three Oddset/Kambi sources:
  - Oddset ATP `matches.json` for ATP upcoming/live odds
  - Oddset `event/live/open.json` as live fallback when ATP `matches.json` is empty/incomplete
  - Oddset tennis-all `listView/tennis/all/all/all/matches.json` as upcoming fallback when ATP `matches.json` has no `NOT_STARTED` rows
- This fixes the case where `matches.json` returns `events: []` while ATP live odds are still visible elsewhere in the app.
- This also fixes the case where ATP `matches.json` has live rows but no upcoming rows, while Kambi still exposes upcoming tennis odds elsewhere.

## Session Memory (2026-03-18)
- Repository instruction file was renamed from `AGENTS.md` to `CODEX.md`.
- Project context and session memory were consolidated into `CODEX.md`; `CONTEXT.md` was removed.
- Repository is now Codex-only for in-repo instructions/context; no separate cross-assistant memory file is maintained.
- `/api/oddset` is the canonical Oddset endpoint for both live-only and mixed live/upcoming consumers.
- `src/fetch-oddset.js` now owns `states` normalization itself:
  - comma-separated strings such as `STARTED,NOT_STARTED` are accepted
  - array input is normalized to uppercase trimmed state tokens
  - empty/invalid input falls back to the default `['STARTED', 'NOT_STARTED']`
- Current merge behavior:
  - keep ATP upcoming rows from Oddset ATP `matches.json`
  - add/override live ATP rows from Oddset live-open payload when Kambi path metadata marks them as ATP
  - add tennis-wide upcoming rows only when `NOT_STARTED` is requested and ATP `matches.json` has no upcoming rows
  - ATP-family filtering now accepts both `atp` and qualifier-style Kambi term keys such as `atp_qual_`
  - ATP-family filtering is now applied explicitly to all oddset sources in code, including upcoming fallback rows
  - prefer ATP `matches.json` odds over fallback sources for the same player pair
  - prefer live-open odds over tennis-wide upcoming fallback for the same player pair
  - ensure started matches emitted by `/api/oddset` always have non-null `score` (Kambi live score or fallback `Live`)
- `GET /api/oddset?raw=1` now returns a source bundle instead of a single upstream payload:
  - `{ matches, open, upcoming, meta, errors }`
- `sandbox/fetch-oddset.js` now awaits the async oddset parser before writing output files.
- New sandbox verifier added: `node sandbox/verify-oddset.js`
  - validates oddset row sorting
  - validates `score === null` for `NOT_STARTED`
  - writes `sandbox/output/verify-oddset.report.json`
- Team preference: when the user writes `commit`, it means `commit + push` (not commit only).
- `AUTHOR.md` is a shared personal profile and should not contain project-specific details for this repository.
- Project-specific context that was previously mixed into `AUTHOR.md` belongs in `CODEX.md` instead, so repository memory stays local to the repo.
- User wants a few simple assistant shorthand commands for a mostly-`main` workflow:
  - `status`
  - `commit`
  - `backup`
  - `restore`
  - `delete-backup`
- Added persistent memory for:
  - ATP domain focus (`1968-present`, `players` / `matches` / `events`, `flatly`)
  - website/query concepts (`/query`, metadata-backed SQL files, `MarkdownProcessor`)
  - ATP reverse-engineering interests and database/UI naming conventions
  - import/operations context such as the full import example and `pi-kato` log monitoring

## Collaboration Notes
- `CODEX.md` is the shared source of truth for Codex instructions, project context, and session memory
- Update this file when operational details, architecture, priorities, or collaboration conventions change
- Keep `AUTHOR.md` limited to stable personal/developer profile information; store all repository-specific memory and conventions in `CODEX.md`
- The change log now also lives in this file; append new entries there instead of maintaining a separate `LOG.md`
- User shorthand commands:
  - `status`
    - Show a concise git overview for learning/debugging:
      - current branch
      - `git status --short`
      - latest commits
    - Does not change files or git history.
  - `commit`
    - Interpret as: stage all + commit + push.
    - Standard sequence:
      - `git add -A`
      - generate an automatic concise commit message from current changes
      - `git commit -m "..."`
      - `git push origin <current-branch>`
    - Defaults:
      - remote: `origin`
      - branch: current checked-out branch
      - no force push by default
  - `backup`
    - Create a GitHub fallback point for the current branch.
    - Standard sequence:
      - if the worktree is dirty: `git add -A` + create an automatic backup commit
      - update backup branch `backup/<current-branch>` to current `HEAD`
      - push current branch if a backup commit was created
      - force-push `backup/<current-branch>` to `origin`
    - Purpose:
      - mark "everything is good here"
      - allow later destructive restore back to that point
  - `restore`
    - Restore the current branch back to the latest remote backup branch `origin/backup/<current-branch>`.
    - Standard sequence:
      - `git fetch origin`
      - `git reset --hard origin/backup/<current-branch>`
      - `git push --force-with-lease origin <current-branch>`
    - Effect:
      - removes uncommitted local changes
      - removes commits made after the latest `backup`
    - Treat this as intentionally destructive and only run it when the user explicitly says `restore`
  - `delete-backup`
    - Delete the remote backup branch for the current branch when the user is fully satisfied and no longer wants that fallback point.
    - Standard sequence:
      - `git push origin --delete backup/<current-branch>`
      - `git fetch origin --prune`
    - Effect:
      - removes the current branch's backup point from GitHub
      - future `restore` will not work until a new `backup` is created

## Change Log

Running change log for the project.

Rules:
- Add new entries at the top.
- Each entry should include date/time, summary, affected files, and commit hash (when available).
- History before this section exists in `git log`.

### 2026-03-18 23:20 CET
- Added npm script `git-delete-backup` for removing the remote backup branch when a fallback point is no longer needed.
- Updated `CODEX.md` shorthand command memory to include `delete-backup`.
- Affected files:
  - `package.json`
  - `CODEX.md`
- Commit:
  - (not committed yet)

### 2026-03-18 22:55 CET
- Added simple user shorthand command semantics for a mostly-`main` workflow:
  - `status`
  - `commit`
  - `backup`
  - `restore`
- Defined `backup`/`restore` around remote backup branches named `backup/<current-branch>`.
- Affected files:
  - `CODEX.md`
- Commit:
  - (not committed yet)

### 2026-03-18 22:35 CET
- Clarified repository memory ownership:
  - `AUTHOR.md` is personal/shared profile only
  - `CODEX.md` is where project-specific memory belongs
- Affected files:
  - `CODEX.md`
- Commit:
  - (not committed yet)

### 2026-03-18 22:20 CET
- Moved ATP project-specific context out of shared `AUTHOR.md` semantics and into repository-local memory in `CODEX.md`.
- Added durable notes about domain focus, key tables/view, website/query concepts, reverse-engineering interests, and naming conventions.
- Affected files:
  - `CODEX.md`
- Commit:
  - (not committed yet)

### 2026-03-18 17:10 CET
- Moved the running change log into `CODEX.md` and removed `LOG.md`.
- Updated remaining references so repository documentation now points to `CODEX.md` only.
- Affected files:
  - `CODEX.md`
  - `LOG.md` (removed)
  - `sandbox/README.md`
- Commit:
  - (not committed yet)

### 2026-03-18 17:00 CET
- Consolidated project instructions/context into `CODEX.md` and removed `CONTEXT.md`.
- Updated active documentation to point to `CODEX.md` as the only in-repo source of truth for Codex.
- Affected files:
  - `CODEX.md`
  - `CONTEXT.md` (removed)
  - `README.md`
  - `LOG.md`
- Commit:
  - (not committed yet)

### 2026-03-12 21:28 CET
- Simplified `/api/calendar` endpoint behavior in `serve`:
  - removed `raw` query handling.
  - endpoint now always returns parsed `{ events: [...] }`.
- Updated docs/context to remove `/api/calendar?raw` usage.
- Affected files:
  - `commands/serve.js`
  - `README.md`
  - `CODEX.md`
- Commit:
  - (not committed yet)

### 2026-03-12 21:24 CET
- Added new API endpoint in `serve`:
  - `GET /api/calendar`
  - default response returns parsed calendar data (`{ events: [...] }`) from `fetch-calendar`.
  - `raw` query parameter returns raw upstream payload.
- Updated docs/context for new endpoint:
  - `README.md`
  - `CODEX.md`
- Affected files:
  - `commands/serve.js`
  - `README.md`
  - `CODEX.md`
- Commit:
  - (not committed yet)

### 2026-03-12 21:16 CET
- Updated `fetch-calendar` event ID format in parsed output:
  - `id` now uses year prefix from `DisplayDate` as `YYYY-Id` (example: `2026-9900`).
  - fallback keeps original `Id` when year cannot be extracted.
- Affected files:
  - `src/fetch-calendar.js`
  - `CODEX.md`
- Commit:
  - (not committed yet)

### 2026-03-12 20:57 CET
- Renamed parsed calendar array key from `tournaments` to `events`.
- `src/fetch-calendar.js` parser now returns:
  - `{ events: [{ name }] }`
- Affected files:
  - `src/fetch-calendar.js`
  - `sandbox/README.md`
  - `CODEX.md`
- Commit:
  - (not committed yet)

### 2026-03-12 20:49 CET
- Updated `src/fetch-calendar.js` parser to return simplified shape:
  - `{ tournaments: [{ name }] }`
- `fetch()` remains raw endpoint passthrough.
- Affected files:
  - `src/fetch-calendar.js`
  - `CODEX.md`
- Commit:
  - (not committed yet)

### 2026-03-12 20:27 CET
- Reset `src/fetch-calendar.js` to raw passthrough mode.
- Separated responsibilities:
  - `fetch()` returns raw endpoint JSON.
  - `parse(raw)` (instance method, not static) currently returns raw unchanged.
- Updated sandbox script to call `fetcher.parse(raw)` instead of static parse call.
- Affected files:
  - `src/fetch-calendar.js`
  - `sandbox/fetch-calendar.js`
  - `CODEX.md`
- Commit:
  - (not committed yet)

### 2026-03-12 20:02 CET
- Added new fetch class `src/fetch-calendar.js` following existing fetcher pattern.
- Affected files:
  - `src/fetch-calendar.js`
  - `CODEX.md`
- Commit:
  - (not committed yet)

### 2026-03-12 02:42 CET
- Removed a legacy documentation file and verified that no references to it remain in the repository.
- Affected files:
  - legacy documentation file (removed)
- Commit:
  - (not committed yet)

### 2026-03-12 02:41 CET
- Created the running project change log.
- Affected files:
  - `LOG.md`
- Commit:
  - (not committed yet)

### 2026-03-12 (earlier today)
- Added a new fetcher for oddset data and wired it into the server endpoint (`GET /api/oddset`).
- Synced README with actual code status (CLI, API, options, data sources, and caveats).
- Affected files:
  - `src/fetch-oddset.js`
  - `commands/serve.js`
  - `README.md`
  - `CODEX.md`
- Commit:
  - `d8b07a5` (README-sync)
  - older related changes are available in `git log`
