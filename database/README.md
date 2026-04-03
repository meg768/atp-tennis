# Database

This folder contains the database artifacts that are checked into the repository.

## Purpose

The `database/` folder is the source of truth for the MariaDB objects used by this project. It exists so a new environment can be bootstrapped without guessing which tables, views, functions, or procedures are required.

## Files

### `schema.sql`

Defines the MariaDB objects used by the app, including:
- core tables such as `events`, `matches`, `players`, `log`, and `settings`
- the `flatly` view

### `functions/*.sql`

One SQL function per file. Current functions:
- `NUMBER_OF_GAMES.sql`
- `NUMBER_OF_SETS.sql`
- `NUMBER_OF_TIE_BREAKS.sql`
- `PLAYER_FATIGUE_FACTOR.sql`
- `PLAYER_LOOKUP.sql`
- `PLAYER_WIN_FACTOR.sql`

Each function file includes an in-file `/* ... */` comment block that explains:
- purpose
- expected input format
- examples
- edge cases
- strictness/validation behavior

Each function file is also formatted so it can be pasted directly into Sequel Pro:
- starts with `DELIMITER ;;`
- uses `DROP FUNCTION IF EXISTS ... ;;`
- omits `DEFINER`
- ends with `DELIMITER ;`

`PLAYER_LOOKUP.sql` returns the single best matching `players.id` for a search
term. It follows the same matching and ranking rules as `PLAYER_SEARCH.sql`,
but returns only one id.

### `procedures/*.sql`

One stored procedure per file. Current procedures:
- `PLAYER_ODDS.sql`
- `PLAYER_SEARCH.sql`

Procedure files follow the same repo conventions as the function files:
- starts with `DELIMITER ;;`
- uses `DROP PROCEDURE IF EXISTS ... ;;`
- omits `DEFINER`
- ends with `DELIMITER ;`

`PLAYER_SEARCH.sql` returns a ranked result set of player candidates for a
search term. It is the primary lookup/search interface for player resolution,
uses the same matching rules as `PLAYER_LOOKUP.sql`, and always returns at most
`5` rows. Exact last-name matches are ranked ahead of generic prefix/contains
matches.

`PLAYER_WIN_FACTOR.sql` is the self-contained source of truth for matchup win
probability. It documents the full factor model inside the function itself and
is intended to replace ad hoc probability blending elsewhere.

`PLAYER_ODDS.sql` returns two rows of decimal odds for a matchup, one row per
player, resolves free-text player inputs through `PLAYER_LOOKUP.sql`, and now
delegates the fair win probability to `PLAYER_WIN_FACTOR.sql` before applying a
fixed margin.

## How It Is Used

- A fresh database can be created by applying `schema.sql` and then the files in `functions/` and `procedures/` if any exist.
- The application expects the required tables, view, helper functions, and any required procedures to already exist.
- The import pipeline updates data in these objects, but it does not create the schema for you.

## Notes

- The project uses MariaDB, even though environment variables use the `MYSQL_` prefix.
- `schema.sql` is the repo-managed bootstrap artifact for tables and views.
- `functions/*.sql` is the repo-managed source of truth for SQL functions.
- `procedures/*.sql` is the repo-managed source of truth for stored procedures.
- When database logic is tuned, the matching SQL file in this folder should be updated so the repo stays in sync with the live database.
- This folder is for schema-level files, not runtime data dumps.
