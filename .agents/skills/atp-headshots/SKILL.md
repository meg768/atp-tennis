---
name: atp-headshots
description: Add missing official ATP player headshots for the current top N in atp-tennis using its MariaDB rankings and Codex's in-app browser. Use when asked to add, update, refresh, or verify files in headshots/; skip existing files unless replacement is explicitly requested.
---

# ATP headshots

Maintain the repository's static `headshots/<ATP-ID>.png` files. Work from the `atp-tennis` repository root. If the user does not specify a count, default to 20.

## Select players

Run:

```bash
node .agents/skills/atp-headshots/scripts/list-top-players.js <count>
```

This read-only script selects the current ranking rows from MariaDB, checks `headshots/`, and returns only players whose `<ATP-ID>.png` file is missing. If `selectedCount` is zero, make no browser requests and report that all requested headshots already exist.

Only when the user explicitly asks to replace or refresh existing images, append `--refresh` to return every selected player. `points IS NOT NULL` is intentional: old player rows can retain a stale `rank` after an import, while current ranking rows have points.

## Fetch images

Use Codex's in-app browser through the available computer-use tooling. Do not launch Chrome with Playwright and do not use `curl`, Node HTTP, or the backend image proxy; ATP's Cloudflare configuration returns challenges or HTTP 403 for those routes.

1. If the selection contains players, open one hidden in-app browser tab at `https://www.atptour.com/en/players/x/<lowercase-id>/overview`.
2. For each selected player, reuse that tab and navigate to the same URL pattern.
3. Wait for the exact image `img[src*="/-/media/alias/player-headshot/<lowercase-id>" i]`.
4. Use the tab's `pageAssets` capability to list observed assets. Select the single image whose URL contains the exact lower-case ATP ID under `/-/media/alias/player-headshot/`.
5. Bundle that asset and copy the resulting binary to `headshots/<UPPERCASE-ID>.png` with mode `0644`.

Process players in small groups and report compact progress. In the default missing-only mode, recheck that the destination does not exist immediately before each browser request and skip it if it appeared meanwhile. Never overwrite or delete another headshot. In explicit refresh mode, a successful asset may replace the corresponding file. If ATP presents a CAPTCHA or browser verification, do not attempt to bypass or solve it—stop and report the blocker. Record a missing or invalid player image as a failure and continue when safe.

## Verify

Before finishing:

- Confirm every requested ATP ID has a file.
- Confirm every new file is PNG and 300 x 300 pixels.
- Compare SHA-256 hashes and report duplicates; do not remove them automatically.
- Report the downloaded, skipped-existing, missing, and failed counts and show `git status --short`.

Do not modify the backend, frontend, database, commit history, or remote repository unless the user asks separately.
