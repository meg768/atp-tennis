# Database

This folder contains the database artifacts that are checked into the repository.

## Purpose

The `database/` folder is the source of truth for the MariaDB objects used by this project. It exists so a new environment can be bootstrapped without guessing which tables, views, functions, or procedures are required.

## Files

### `schema.sql`

Defines the MariaDB objects used by the app, including:
- core tables such as `events`, `matches`, `players`, `log`, and `settings`
- the `flatly` view
- all required functions and procedures

This is a structure-only dump from the live `atp` database. It contains no
application data and can be executed on its own to recreate the complete
database structure.

The dump includes the score helpers, player lookup/search routines,
`PLAYER_ODDS`, and the canonical TA-calibrated GPT model in
`PLAYER_WIN_FACTOR`.

## How It Is Used

- A fresh database structure can be created by applying `schema.sql`; no other SQL files are required for bootstrap.
- The application expects the required tables, view, helper functions, and any required procedures to already exist.
- The import pipeline updates data in these objects, but it does not create the schema for you.

## Notes

- The project uses MariaDB, even though environment variables use the `MYSQL_` prefix.
- `schema.sql` is the complete, standalone repo-managed structure bootstrap.
- When database logic changes, regenerate and restore-test `schema.sql` so the repo stays in sync with the live database.
- This folder is for schema-level files, not runtime data dumps.
