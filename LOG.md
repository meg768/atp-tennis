# LOG

Running change log for the project.

Rules:
- Add new entries at the top.
- Each entry should include date/time, summary, affected files, and commit hash (when available).
- History before this file exists in `git log`.

## 2026-03-12

### 2026-03-12 21:28 CET
- Simplified `/api/calendar` endpoint behavior in `serve`:
  - removed `raw` query handling.
  - endpoint now always returns parsed `{ events: [...] }`.
- Updated docs/context to remove `/api/calendar?raw` usage.
- Affected files:
  - `commands/serve.js`
  - `README.md`
  - `CONTEXT.md`
  - `LOG.md`
- Commit:
  - (not committed yet)

### 2026-03-12 21:24 CET
- Added new API endpoint in `serve`:
  - `GET /api/calendar`
  - default response returns parsed calendar data (`{ events: [...] }`) from `fetch-calendar`.
  - `raw` query parameter returns raw upstream payload.
- Updated docs/context for new endpoint:
  - `README.md`
  - `CONTEXT.md`
- Affected files:
  - `commands/serve.js`
  - `README.md`
  - `CONTEXT.md`
  - `LOG.md`
- Commit:
  - (not committed yet)

### 2026-03-12 21:16 CET
- Updated `fetch-calendar` event ID format in parsed output:
  - `id` now uses year prefix from `DisplayDate` as `YYYY-Id` (example: `2026-9900`).
  - fallback keeps original `Id` when year cannot be extracted.
- Affected files:
  - `src/fetch-calendar.js`
  - `CONTEXT.md`
  - `LOG.md`
- Commit:
  - (not committed yet)

### 2026-03-12 20:57 CET
- Renamed parsed calendar array key from `tournaments` to `events`.
- `src/fetch-calendar.js` parser now returns:
  - `{ events: [{ name }] }`
- Affected files:
  - `src/fetch-calendar.js`
  - `sandbox/README.md`
  - `CONTEXT.md`
  - `LOG.md`
- Commit:
  - (not committed yet)

### 2026-03-12 20:49 CET
- Updated `src/fetch-calendar.js` parser to return simplified shape:
  - `{ tournaments: [{ name }] }`
- `fetch()` remains raw endpoint passthrough.
- Affected files:
  - `src/fetch-calendar.js`
  - `CONTEXT.md`
  - `LOG.md`
- Commit:
  - (not committed yet)

### 2026-03-12 20:27 CET
- Reset `src/fetch-calendar.js` to raw passthrough mode.
- Separated responsibilities:
  - `fetch()` returns raw endpoint JSON.
  - `parse(payload)` (instance method, not static) currently returns payload unchanged.
- Updated sandbox script to call `fetcher.parse(raw)` instead of static parse call.
- Affected files:
  - `src/fetch-calendar.js`
  - `sandbox/fetch-calendar.js`
  - `CONTEXT.md`
  - `LOG.md`
- Commit:
  - (not committed yet)

### 2026-03-12 20:02 CET
- Added new fetch class `src/fetch-calendar.js` following existing fetcher pattern.
- Affected files:
  - `src/fetch-calendar.js`
  - `CONTEXT.md`
  - `LOG.md`
- Commit:
  - (not committed yet)

### 2026-03-12 02:42 CET
- Removed a legacy documentation file and verified that no references to it remain in the repository.
- Affected files:
  - legacy documentation file (removed)
  - `LOG.md`
- Commit:
  - (not committed yet)

### 2026-03-12 02:41 CET
- Created this log file (`LOG.md`) to track changes continuously.
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
  - `CONTEXT.md`
- Commit:
  - `d8b07a5` (README-sync)
  - older related changes are available in `git log`
