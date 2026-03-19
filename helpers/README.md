# Helpers

Maintenance scripts that are run manually when needed.

## Scripts

### `update-player-wikipedia.js`

Backfills `players.wikipedia` in MariaDB.

Examples:

```bash
./update-player-wikipedia.js --limit 25
./update-player-wikipedia.js --dry-run --limit 10
./update-player-wikipedia.js --player A0E2 --dry-run
npm run update-wikipedia -- --limit 25
```

Behavior:
- Prioritizes players in this order:
  - current top 100 by `rank`
  - historically strongest players by `highest_rank`, `career_titles`, `career_wins`, and `career_prize`
  - everyone else
- Default mode only processes rows where `players.wikipedia IS NULL`
- Writes a Wikipedia URL when found
- Writes an empty string when the player has been checked but no Wikipedia page was found
- Uses conservative pacing plus retry/backoff on Wikipedia `429` responses
- Loads `.env` from the repo root even when the script is run from inside `helpers/`

Column semantics for `players.wikipedia`:
- `NULL` = not processed yet
- `''` = processed, no page found
- `https://...` = page found

Important options:
- `--limit`: process the next N unprocessed players
- `--player`: process one specific player by id or exact name
- `--dry-run`: print matches without writing to the database
- `--overwrite`: re-check players even if `wikipedia` is already non-`NULL`
- `--delay`, `--retries`, `--retry-backoff`: tune Wikipedia rate-limit behavior

### `fetch-flags.js`

Downloads ATP flag SVG files from `atptour.com` for a hardcoded list of country codes.

Example:

```bash
./fetch-flags.js
```

Behavior:
- Fetches SVG files one by one from ATP's flag image path
- Writes files to `helpers/flags/`
- Creates `helpers/flags/` if it does not already exist
- Logs failed downloads and continues with the next country code

## Notes

- These scripts are not part of the normal `import` pipeline.
- Run them manually when you want to backfill or refresh supporting data.
