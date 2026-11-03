# Projektkontext

Äldre projektbeslut och instruktioner finns i CODEX.md.

## Drift och aktuell status – 2026-11-03
- Alla ändringar i oddsinsamlingen är driftsatta på pi-kato och verifierade. Migration 017/018 är körda: `event` är en indexerad nullable VARCHAR(20) kopplad logiskt till `events.id`, och `tournament` heter `event_name`.
- Node-timjobbet och den lokala Python-insamlaren är provkörda: båda sparade 12 godkända prematcher. PM2 `atp-odds` har exitkod 0, cron `0 * * * *`, autorestart=false och sparad processlista. `stopped` mellan körningarna är normalt.
- Samtliga 53 tester passerar: 24 Node och 29 Python inklusive MariaDB-integration. Alla 38 odds-rader med importerade spelade matcher var oförändrade efter båda verkliga körningarna. Schemafilerna matchar live-tabellen. Ingen funktionell ändring återstår att driftsätta.

## Fördröjd dygnsimport – 2026-11-03
- ATP-events och matcher importeras per dygn och kan komma efter Svenska Spels odds. Båda insamlarna kompletterar saknade `event`, `player` och `opponent` på redan sparade rader efter varje lyckad hämtning, även tomt flöde och efter matchstart.
- Endast NULL-kopplingar fylls, vid entydiga exakta namn/id och tidigare turneringsalias/datumfönster (-20/+7 dagar). Kända kopplingar, namn, starttid och alla odds bevaras. Kompletteringen beräknar aldrig TA, importerar inga resultat och skriver inte till övriga ATP-tabeller. Tvetydiga/saknade träffar förblir NULL. Metadata och prematchpriser ingår i samma transaktion och befintliga databaslås.

## Syfte och schema – 2026-11-03
- Huvudsyftet är backtesting av spelstrategier mot sparade förhandsodds och faktiska resultat. Matchen måste kopplas entydigt via event och båda spelar-id:n. Ingen specifik strategi eller insatsmodell är vald; avbrutna matcher och walkovers kräver uttryckliga regler. Historiska TA-odds räknas aldrig om med senare ratingar.
- Båda schemafilerna hålls synkade mot SHOW CREATE TABLE odds. Magnus kolumnordning: id, time, event, event_name, player, player_name, player_oddset, player_ta, opponent, opponent_name, opponent_oddset, opponent_ta.
- Migrationerna 017/018 finns både i ATP Tennis Odds/migrations och versionshanteras i atp-tennis/database/migrations. De är redan körda och ska inte köras igen.
