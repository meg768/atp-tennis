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

## Sandbox Convention

- Keep sandbox-specific notes and changes in this file.
- Avoid adding sandbox iteration notes to top-level `LOG.md`.
- For sandbox scripts, use unique output names based on script filename.
