# Database

This folder contains the database artifacts that are checked into the repository.

## Purpose

The `database/` folder is the source of truth for the SQL schema used by this project. It exists so a new environment can be bootstrapped without guessing which tables, views, or SQL helper functions are required.

## Files

### `schema.sql`

Defines the MariaDB objects used by the app, including:
- core tables such as `events`, `matches`, `players`, `log`, and `settings`
- the `flatly` view
- helper SQL functions such as `NUMBER_OF_GAMES`, `NUMBER_OF_SETS`, and `NUMBER_OF_TIE_BREAKS`

## How It Is Used

- A fresh database should be created from `schema.sql` before running imports.
- The application expects the required tables, view, and helper functions to already exist.
- The import pipeline updates data in these objects, but it does not create the schema for you.

## Notes

- The project uses MariaDB, even though environment variables use the `MYSQL_` prefix.
- `schema.sql` represents the repo-managed schema artifact. If the live database changes, this file should be updated to match.
- This folder is for schema-level files, not runtime data dumps.
