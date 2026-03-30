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
- `PLAYER_FORM_FACTOR.sql`
- `PLAYER_FATIGUE_FACTOR.sql`
- `PLAYER_LOOKUP.sql`
- `PLAYER_RANK_FACTOR.sql`
- `PLAYER_HEAD_TO_HEAD_FACTOR.sql`

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

`PLAYER_FORM_FACTOR.sql` is intentionally documented in detail in the file itself.
It currently uses:
- completed matches only
- a recency-weighted window over the last `weeks`
- neutral baseline `0.5`
- conservative smoothing equivalent to 16 weighted 50/50 matches

This is meant to make later tuning easier without having to rediscover the original reasoning.
The function file also uses an in-file `/* ... */` block for the full design rationale.
It is also formatted for direct paste/run in Sequel Pro:
- starts with `DELIMITER ;;`
- uses `DROP FUNCTION IF EXISTS ... ;;`
- omits `DEFINER`
- ends with `DELIMITER ;`

`PLAYER_LOOKUP.sql` returns the single best matching `players.id` for a search
term. It follows the same matching and ranking rules as `PLAYER_SEARCH.sql`,
but returns only one id.

### `procedures/*.sql`

One stored procedure per file. Current procedures:
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
