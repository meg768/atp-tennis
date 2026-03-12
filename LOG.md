# LOG

Running change log for the project.

Rules:
- Add new entries at the top.
- Each entry should include date/time, summary, affected files, and commit hash (when available).
- History before this file exists in `git log`.

## 2026-03-12

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
