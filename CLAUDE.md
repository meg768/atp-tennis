# ATP Tennis — Projektöversikt

Node.js-applikation som hämtar, lagrar och serverar ATP-tennisdata från atptour.com via ett MySQL-databasen.

## Teknikstack

- **Runtime**: Node.js (CommonJS, `require`)
- **CLI**: `yargs` — alla kommandon registreras i `atp.js`
- **Databas**: MySQL via `mysql`-paketet (inte mysql2), singleton i `src/mysql.js`
- **Webb**: Express 5 på port **3004**, startas med `node atp.js serve`
- **AI**: OpenAI Assistants API (`openai`-paketet) — kräver `OPENAI_API_KEY` och `OPENAI_ASSISTANT_ID` i `.env`
- **HTTP-hämtning**: `axios` via `src/gopher.js` → `src/fetcher.js`
- **Config**: `dotenv` — `.env` i projektrot

## Miljövariabler (`.env`)

```
MYSQL_HOST=
MYSQL_USER=
MYSQL_PORT=
MYSQL_PASSWORD=
MYSQL_DATABASE=
OPENAI_API_KEY=
OPENAI_ASSISTANT_ID=
```

## Databasschema

### Tabeller

**`events`** — Turneringar
- `id` varchar(20) PK
- `date` date
- `name` varchar(50)
- `location` varchar(50) — land
- `type` varchar(50) — 'Grand Slam', 'Masters', 'ATP-500', 'ATP-250'
- `surface` varchar(50) — 'Hard', 'Clay', 'Grass'
- `url` varchar(100)

**`matches`** — Matchresultat
- `id` varchar(50) PK
- `event` varchar(50) FK → events.id
- `round` varchar(50) — 'F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128'
- `winner` varchar(50) FK → players.id
- `loser` varchar(50) FK → players.id
- `winner_rank` int, `loser_rank` int
- `score` varchar(50) — format '7-6(5) 3-6 6-3'
- `status` enum('Completed','Aborted','Walkover','Unknown')
- `duration` varchar(50) — format 'HH:MM'

**`players`** — Spelardata
- `id` varchar(32) PK
- `name`, `country`, `age`, `birthdate`, `pro`, `active`, `height`, `weight`
- `rank`, `highest_rank`, `highest_rank_date`
- `career_wins/losses/titles/prize`, `ytd_wins/losses/titles/prize`
- `coach`, `points` (ATP-poäng)
- `serve_rating`, `return_rating`, `pressure_rating` (52-veckors ATP-rating)
- `elo_rank`, `elo_rank_clay/grass/hard`
- `hard_factor`, `clay_factor`, `grass_factor` — vinst-% per underlag senaste 2 år (0–100)
- `url`, `image_url`

**`queries`** — Sparade SQL-frågor (name, question, query)

**`settings`** / **`storage`** — JSON-nyckel/värde-lagring (`key` PK, `value` JSON-validerat)

**`log`** — timestamp + message (auto-timestamp)

### View: `flatly`
Flat JOIN av matches + players (A=winner, B=loser) + events, sorterad på event_date.
Kolumner: id, event_date, event_id, event_name, event_location, event_type, event_surface,
round, winner, loser, winner_id, winner_rank, loser_id, loser_rank, score, status, duration.
**Används flitigt i queries och ELO-beräkning.**

### MySQL-funktioner
- `IS_MATCH_COMPLETED(score)` — kontrollerar om sista setet är ett giltigt avslutande set
- `NUMBER_OF_GAMES_PLAYED(score)` — summerar alla games
- `NUMBER_OF_MINUTES_PLAYED(duration)` — HH:MM → minuter
- `NUMBER_OF_SETS(event_type, round)` — 5 för Grand Slam main draw, annars 3
- `NUMBER_OF_SETS_PLAYED(score)` — antal space-separerade tokens
- `NUMBER_OF_TIEBREAKS_PLAYED(score)` — räknar '(' i score-strängen

### Stored procedures
- `sp_log(message)` — loggar till log-tabellen
- `sp_update()` — körs efter import: anropar de tre nedan
- `sp_update_match_duration()` — trimmar HH:MM:SS → HH:MM
- `sp_update_match_status(force_update)` — sätter Completed/Aborted/Walkover/Unknown
- `sp_update_surface_factors()` — nollställer och räknar om surface factors för aktiva spelare
- `sp_update_surface_factors_for_player(player_id)` — använder flatly + temp-tabell, senaste 2 år

## Projektstruktur

```
atp.js                  CLI-entry point (yargs)
commands/               CLI-kommandon (ett per fil)
  import.js             Huvudimport: rankings → activity → scores → players → ELO → sp_update
  serve.js              Express-server (port 3004)
  update-elo.js         Uppdaterar ELO-rankings
  update-players.js     Uppdaterar spelardata
  update-stats.js       Uppdaterar serve/return/pressure-ratings
  events.js, scores.js, player.js, rankings.js, live.js, activity.js, stats.js
src/
  mysql.js              MySQL singleton (connect/disconnect/query/upsert)
  storage.js            JSON-nyckel/värde via storage-tabellen
  chat-atp.js           OpenAI Assistants-klient (sparar threadID i storage)
  gpt-sql-prompt.js     Bygger SQL-prompt från gpt-sql-prompt.txt
  gpt-sql-prompt.txt    System-prompt för GPT → MySQL-fråge-generering
  elo.js                ELO-beräkning (computeELO/updateELO) baserad på flatly, senaste 52 veckor
  fetcher.js            HTTP-hämtning mot atptour.com (500ms delay)
  gopher.js             axios-wrapper
  fetch-activity.js     Hämtar spelares aktivitetshistorik
  fetch-scores.js       Hämtar matchresultat per event
  fetch-player.js       Hämtar spelardetaljer
  fetch-rankings.js     Hämtar ATP-rankings
  fetch-stats.js        Hämtar serve/return/pressure-stats
  fetch-live.js         Hämtar live-data
  command.js            Basklass för CLI-kommandon
  markdown-processor.js Processar markdown-svar (kör SQL-block mot databasen)
  probe.js              Tidsmätning
  logger.js             Loggkonfiguration (1 MB)
  cache.js              Caching-hjälpare
sql/
  procedures/           SQL-filer för stored procedures
  views/                SQL-filer för vyer
  functions/            SQL-filer för funktioner
  matches.sql           Övriga match-relaterade SQL
helpers/
  fetch-flags.js        Hämtar landsflags
```

## API-endpoints (serve)

| Method | Path | Beskrivning |
|--------|------|-------------|
| GET | `/ok` | Healthcheck |
| GET | `/api/ping` | Pong |
| POST | `/api/query` | Kör godtycklig SQL-query |
| GET | `/api/chat?prompt=...` | OpenAI-chat → SQL → resultat via MarkdownProcessor |
| GET | `/api/live` | Live-data från ATP |
| GET | `/api/rankings` | ATP-rankings |

## Import-flöde

1. Hämta top-N rankings (default 100)
2. Per spelare: hämta aktivitetshistorik sedan år X (default förra året)
3. Rekursivt: importera motståndare som inte redan importerats
4. Hämta scores + duration per event
5. Spara events, matches, players med `upsert`
6. Uppdatera serve/return/pressure-stats
7. Beräkna och spara ELO-rankings
8. Kör `sp_update()` (duration-format, match-status, surface factors)
9. Spara `import.status` i settings

Import kan köras med `--loop` (default 0.33 dagar = ~8h) för kontinuerlig uppdatering.

## Chat/AI-flöde

`/api/chat?prompt=...`:
1. `ChatATP` skickar prompt till OpenAI Assistants (återanvänder threadID från storage)
2. Svaret processas av `MarkdownProcessor` — SQL-block i svaret körs mot databasen
3. Resultat returneras som JSON

`gpt-sql-prompt.txt` definierar schema och regler för GPT:s SQL-generering.

## ELO-beräkning

- Baseras på `flatly`-vyn, senaste 52 veckor
- Kräver minst 10 matcher per spelare för att inkluderas
- Starting ELO: 1500
- K-faktor: `250 / ((matches + 5) ^ 0.4) * 4`, Grand Slam-matcher × 1.1
- Score-index baseras på games-ratio (inte bara W/L)
- Pensionerade matcher (RET) exkluderas
- Resultatet sparas i `players.elo_rank`

## Kodstilar och konventioner

- CommonJS (`require`/`module.exports`), inte ES modules
- Singletons exporteras direkt: `module.exports = new MySQL()`
- Asynkront med async/await genomgående
- MySQL-queries via `mysql.query({ sql, format })` med parameterisering
- `upsert()` i mysql.js: INSERT ... ON DUPLICATE KEY UPDATE
- Loggning via `console.log` eller `sp_log` i databasen
