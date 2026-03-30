# Sandbox

Quick test area for fetch modules.

## Test `fetch-calendar`

```bash
./sandbox/fetch-calendar.js
```

Always writes both files to `sandbox/output/`:
- `fetch-calendar.parsed.json` (simplified JSON: `{ events: [{ id, name, date, location, type, surface }] }`, where `id` is `YYYY-Id`, e.g. `2026-9900`)
- `fetch-calendar.raw.json` (raw ATP payload)
- Runs silently on success (no console output).

## Test `fetch-activity`

```bash
./sandbox/fetch-activity.js
```

Always writes both files to `sandbox/output/`:
- `fetch-activity.parsed.json` (parsed activity JSON from `src/fetch-activity.js`)
- `fetch-activity.raw.json` (raw ATP payload)
- Uses hardcoded sandbox input: `player=R0DG`, `since=2020`.
- Runs silently on success (no console output).

## Test `fetch-archive`

```bash
./sandbox/fetch-archive.js
```

Always writes both files to `sandbox/output/`:
- `fetch-archive.parsed.json` (parsed archive JSON from `src/fetch-archive.js`)
- `fetch-archive.raw.json` (raw ATP payload)
- Uses hardcoded sandbox input: `event=2024-0339`.
- Runs silently on success (no console output).

## Test `fetch-top-players`

```bash
./sandbox/fetch-top-players.js
```

Always writes both files to `sandbox/output/`:
- `fetch-top-players.parsed.json` (parsed rankings JSON from `src/fetch-top-players.js`)
- `fetch-top-players.raw.json` (raw ATP payload)
- Uses hardcoded sandbox input: `top=100`.
- Runs silently on success (no console output).

## Test `fetch-player`

```bash
./sandbox/fetch-player.js
```

Always writes both files to `sandbox/output/`:
- `fetch-player.parsed.json` (parsed player JSON from `src/fetch-player.js`)
- `fetch-player.raw.json` (raw ATP payload)
- Uses hardcoded sandbox input: `player=A0E2`.
- Runs silently on success (no console output).

## Test `fetch-oddset`

```bash
./sandbox/fetch-oddset.js
```

Always writes both files to `sandbox/output/`:
- `fetch-oddset.parsed.json` (parsed odds JSON from `src/fetch-oddset.js`)
- `fetch-oddset.raw.json` (raw Oddset payload)
- Uses hardcoded sandbox input: default states `STARTED,NOT_STARTED`.
- Runs silently on success (no console output).

## Test `compute-odds`

```bash
./sandbox/compute-odds.js
```

Writes one JSON object to `stdout`:
- includes `input`, resolved `playerA` / `playerB`, and calculated `odds` from `src/compute-odds.js`
- uses hardcoded sandbox input: `playerA=S0AG`, `playerB=A0E2`, `surface=Hard`
- requires local DB access via `.env`

## Test `fetch-head-to-head`

```bash
./sandbox/fetch-head-to-head.js
```

Always writes both files to `sandbox/output/`:
- `fetch-head-to-head.parsed.json` (normalized H2H JSON with overall stats, by-surface breakdown and recent matches)
- `fetch-head-to-head.raw.json` (raw query bundle before parse)
- Uses hardcoded sandbox input: `playerA=S0AG`, `playerB=A0E2`, `limit=5`.
- Requires local DB access via `.env`.
- Runs silently on success (no console output).

## Test `fetch-player-search`

```bash
node sandbox/fetch-player-search.js
```

Always writes both files to `sandbox/output/`:
- `fetch-player-search.parsed.json` (same raw `CALL PLAYER_SEARCH(?)` result, written for convenience)
- `fetch-player-search.raw.json` (raw `CALL PLAYER_SEARCH(?)` result bundle)
- Uses hardcoded sandbox input: `query=Borg`.
- Requires local DB access via `.env`.
- Runs silently on success (no console output).

## Test `fetch-player-lookup`

```bash
node sandbox/fetch-player-lookup.js
```

Always writes both files to `sandbox/output/`:
- `fetch-player-lookup.parsed.json` (same raw `SELECT PLAYER_LOOKUP(...)` result, written for convenience)
- `fetch-player-lookup.raw.json` (raw `SELECT PLAYER_LOOKUP(...)` result)
- Uses hardcoded sandbox input: `query=Borg`.
- Requires local DB access via `.env`.
- Runs silently on success (no console output).

## Verify `oddset` Contract

```bash
node sandbox/verify-oddset.js
```

Writes one file to `sandbox/output/`:
- `verify-oddset.report.json` (summary of counts, raw meta/errors, and one live/upcoming sample row)
- Fails fast if rows are unsorted, if `NOT_STARTED` rows have non-null `score`, if non-ATP upcoming rows leak through, or if the parsed response shape is broken.

## Sandbox Convention

- Keep sandbox-specific notes and changes in this file.
- Avoid adding sandbox iteration notes to the top-level change log section in `CODEX.md`.
- For sandbox scripts, use unique output names based on script filename.
