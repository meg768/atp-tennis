# ATP Tennis — Mergad kontext (2026-02-25)

## Projektöversikt
- Node.js-applikation som hämtar, lagrar och serverar ATP-tennisdata från `atptour.com`.
- CLI-entrypoint: `atp.js` (yargs-kommandon i `commands/`).
- Datalagring i MySQL/MariaDB (`src/mysql.js`, schema i `database/` och `sql/`).
- Driftkontext: `atp.js` används dagligen för import från ATP-endpoints.

## Teknikstack
- Runtime: Node.js (CommonJS, `require`)
- CLI: `yargs`
- Databas: `mysql` (singleton i `src/mysql.js`)
- API: Express 5 på port `3004` (`node atp.js serve`)
- AI: OpenAI Assistants API (`openai`)
- HTTP-hämtning: `src/fetcher.js` + `src/gopher.js`
- Konfiguration: `dotenv` via `.env`

## Miljövariabler
- `MYSQL_HOST`
- `MYSQL_USER`
- `MYSQL_PORT`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `OPENAI_API_KEY`
- `OPENAI_ASSISTANT_ID`

## Databasmodell (huvuddelar)
- Tabeller: `events`, `matches`, `players`, `queries`, `settings`, `storage`, `log`
- Viktiga vyer: `flatly`, `currently`
- Procedurer: `sp_update`, `sp_update_match_status`, `sp_update_surface_factors`, `sp_update_surface_factors_for_player`
- SQL-funktioner för score/duration/set-beräkning finns i `sql/functions/`

## Projektstruktur
- `atp.js`: registrerar och kör CLI-kommandon
- `commands/import.js`: huvudimport (rankings -> activity -> scores -> players -> stats -> ELO -> `sp_update`)
- `commands/serve.js`: API/serve-lager
- `src/fetch-*.js`: ATP-hämtning och parsing
- `src/elo.js`: ELO-beräkning och DB-uppdatering
- `src/markdown-processor.js`: processar AI-svar och kan köra query-block
- `database/schema.sql`: schema + vydefinitioner
- `sql/`: procedurer, funktioner, views

## API-endpoints (serve)
- `GET /ok`
- `GET /api/ping`
- `POST /api/query`
- `GET /api/chat?prompt=...`
- `GET /api/live`
- `GET /api/rankings`

## Importflöde (operativt)
1. Hämta top-N ranking.
2. Hämta aktivitet per spelare sedan valt år.
3. Rekursivt inkludera motståndare.
4. Hämta score/duration per event.
5. Spara `events`, `matches`, `players` via upsert.
6. Uppdatera serve/return/pressure.
7. Beräkna och spara ELO.
8. Kör `sp_update()`.
9. Spara importstatus i `settings`.

## Prioriterade fynd från Codex-analys
1. Kritisk: oautentiserad SQL-exekvering via `/api/query` + `multipleStatements=true`.
2. Kritisk: AI-svar kan trigga direkt SQL-exekvering i markdown-processorn.
3. Hög: ELO-kod använder `^` (XOR) där potens förväntas.
4. Hög: async-race i `update-elo`/`update-stats` (saknat `await` på connect/disconnect).
5. Hög: möjlig null-dereferens i live-score parsing.
6. Medium: `live --debug` ignorerar debug-inläst data.
7. Medium: `fetch-rankings` ignorerar `top` och har sen null-check.
8. Medium: `update-players` anropar `this.log` utan implementation.
9. Medium: möjlig namnkonflikt i SQL-procedur för surface factors.

## Arbetsriktning
- Prioritera fix av de 5 högst rankade punkterna först.
- Behåll daglig import stabil under ändringar.
- Vid ändringar i SQL/procedurer: verifiera mot faktisk databas med testkörning.
