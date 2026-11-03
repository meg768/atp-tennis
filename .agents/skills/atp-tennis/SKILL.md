---
name: atp-tennis
description: Read Magnus's ATP MariaDB database and fetch current Svenska Spel ATP odds directly without a browser. Use for tennis statistics, match history, rankings, TA probabilities, and odds comparisons across the tennis projects.
---

# ATP tennis

Use the bundled `scripts/database.py` to read the ATP database directly. Resolve
paths relative to this skill's directory, not the calling project's directory.
For Svenska Spel odds, use the bundled HTTP fetcher described below.

## Connection and queries

Use the machine-local Python environment at
`~/.local/share/codex/atp-tennis/venv/bin/python` and the shared
`<skill>/scripts/database.py`. Replace `<skill>` with the discovered skill
directory's absolute path and quote it in shell commands (iCloud paths contain
spaces). Set up the local environment once on each computer:

```sh
python3 -m venv "$HOME/.local/share/codex/atp-tennis/venv"
"$HOME/.local/share/codex/atp-tennis/venv/bin/python" -m pip install -r "<skill>/requirements.txt"
```

Read credentials from `~/.config/atp-tennis/.env` on each computer.
`.env.example` lists the required keys. Keep its directory mode `700` and file
mode `600`. Do not put credentials or the Python environment in iCloud.
An explicit `--env-file /absolute/path/to/.env` overrides `ATP_TENNIS_ENV_FILE`,
which overrides the default file. Do not guess another project's credentials
when the selected file is missing. Never print credentials or include `.env`
in Git, reports, or examples.

SQL can come from a file or standard input; output is JSON containing result
sets with `rows` and `rowcount`:

```sh
echo 'SELECT 1 AS connection_ok;' | "$HOME/.local/share/codex/atp-tennis/venv/bin/python" "<skill>/scripts/database.py"
"$HOME/.local/share/codex/atp-tennis/venv/bin/python" "<skill>/scripts/database.py" /absolute/path/query.sql
echo 'SELECT id, name, rank FROM players WHERE id = %s;' | "$HOME/.local/share/codex/atp-tennis/venv/bin/python" "<skill>/scripts/database.py" --params '["S0AG"]'
```

For programmatic use, import `scripts/database.py` from the skill and call
`execute(sql, params=None, env_file=None)`. Bind values with `%s` parameters;
do not interpolate player names into SQL. The tool accepts one statement
beginning with SELECT, WITH, SHOW, DESCRIBE, DESC, or EXPLAIN. It uses a read-only
MariaDB transaction and always rolls back and closes the connection. CALL and
database mutations are outside this tool's scope. This skill does not grant
permission to change data or schema; follow the user's authorization. For a
database-level security boundary, use an account with read-only grants.

## Current Svenska Spel odds

Run `~/.local/share/codex/atp-tennis/venv/bin/python` with the shared `scripts/svenskaspel.py` to fetch the
direct Svenska Spel/Kambi ATP offering feed. It needs no login, API key,
or browser. Use this script first for Svenska Spel odds and match status;
do not open Svenska Spel's website for these tasks. If the direct request
fails, report the failure rather than silently switching to a browser or
reusing old prices. Browser use for Svenska Spel requires a user request.

Read [references/svenskaspel.md](references/svenskaspel.md) when extracting
match-winner odds or interpreting market and event status. Save the timestamped
JSON in the calling project's analysis directory when evidence is needed.

## Working with tennis data

- Read [references/schema.md](references/schema.md) for tables, joins,
  identity resolution, match statuses, and time limitations. Check live
  metadata when the required field is not documented or has changed.
- Read [references/ta-odds.md](references/ta-odds.md) for TA probabilities,
  the existing 5% pricing margin, precision, and comparison formulas.
- Resolve both players to ATP IDs and confirm their names before match
  analysis. `PLAYER_LOOKUP` returns one best match; inspect ambiguous names
  rather than trusting that choice automatically.
- Distinguish ATP ranking positions from Elo rating values. State date,
  surface, tournament levels, qualification scope, and whether aborted
  matches or walkovers enter a statistic. Database history may lag live play.
- Do not use `tennis.egelberg.se`, including as a fallback or proxy. Fetch
  fresh external information from ATP, organizers, Tennis Abstract, or the
  relevant odds provider when the task requires it. Verify access and cite
  the actual source. This skill bundles database access and the direct
  Svenska Spel feed; other external sources need separate verification.
- Keep betting portfolios, stake sizes, selection windows, and `ping`
  behavior in the calling project. Consult that project's instructions.
  This shared skill neither places bets nor registers recommendations.
