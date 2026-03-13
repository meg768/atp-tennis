# Sandbox

Quick test area for fetch modules.

## Test `fetch-calendar`

```bash
./sandbox/fetch-calendar.js
```

Always writes both files to `sandbox/output/`:
- `fetch-calendar.parsed.json` (simplified JSON: `{ events: [{ id, name, date, location, type }] }`, where `id` is `YYYY-Id`, e.g. `2026-9900`)
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

## Test `fetch-rankings`

```bash
./sandbox/fetch-rankings.js
```

Always writes both files to `sandbox/output/`:
- `fetch-rankings.parsed.json` (parsed rankings JSON from `src/fetch-rankings.js`)
- `fetch-rankings.raw.json` (raw ATP payload)
- Uses hardcoded sandbox input: `top=100`.
- Runs silently on success (no console output).

## Sandbox Convention

- Keep sandbox-specific notes and changes in this file.
- Avoid adding sandbox iteration notes to top-level `LOG.md`.
- For sandbox scripts, use unique output names based on script filename.
