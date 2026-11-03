# Projektkontext

## GitHub-lagring – 2026-11-03
- Magnus vill lagra projektmaterialet på GitHub och har uttryckligen godkänt att analys- och pappersportföljhistorik publiceras i det offentliga meg768/atp-tennis. Detta ersätter äldre instruktioner om att analysis/ inte ska versionshanteras.
- Relevanta skills källkod finns nu i .agents/skills/. Aktiva analys-/portföljverktyg använder repots atp-tennis-skill. Analysunderlag/bilder ligger i analysis/ och läsande daterade exporter av players/events/matches/odds/bets i data/snapshots/. Exporterna är historiska kopior; den löpande driften och bokföringen använder fortfarande MariaDB.
- Hemligheter, anslutningsinställningar, installerade beroenden, virtuella miljöer, loggar och fullständiga speglingar av externa nyhetssidor versionshanteras inte. Källänkar och egna sammanfattningar ersätter nyhetsspeglarnas HTML i Git.
- Magnus har efter sammanslagningen själv raderat de gamla iCloud-projektmapparna. Kvarvarande historiskt underlag i huvudrepot bevaras; referenser till originalarkiv längre ned är historiska och betyder inte att de fortfarande finns.


## Sammanslagning – 2026-11-03
- Magnus vill ha ett enda aktivt lokalt Codex-projekt, ATP Tennis, med /Users/magnus/GitHub/atp-tennis som hem för kod, verktyg och instruktioner. Tidigare ATP Tennis, ATP Betting och ATP Tennis Odds i iCloud bevaras som arkiv.
- Aktiva Python-analys- och portföljverktyg är samlade i scripts/, tester i tests/. Befintlig Node-struktur och pi-kato-sökväg /home/pi/atp-tennis bevaras. Node valdes efter jämförelse med Python-insamlaren: samma prematchfilter, TA-prissättning, lås och metadataregler; Node är redan ordinarie timjobb. Ingen andra insamlare aktiveras.
- AGENTS.md är gemensamma instruktioner. Detaljer finns i docs/analysis.md, docs/backtesting.md, docs/portfolio.md, docs/odds.md och tracking/README.md. CODEX.md hänvisar till dessa; tidigare innehåll är endast historik i docs/legacy-codex.md.
- Databas och portföljdata flyttas eller ändras inte. bets-schema är hämtat som struktur från live och ingår i database/schema.sql. odds och bets har skilda uppgifter; backtesting skriver aldrig portföljdata.
- Enda ping-automationen behåller dagligen 09.00 Europe/Stockholm och samma beteende; dess prompt använder nu huvudrepot som arbetskatalog. Oddsinsamlingen behåller PM2-jobbet atp-odds varje hel timme på pi-kato. Vanlig analys startar inget ping eller utskick.
- Historiska analysunderlag finns lokalt under Git-ignorerade analysis/ och oförändrade i gamla projektmappar. Inga runtime-data, hemligheter eller virtuella miljöer flyttas till Git.

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

## Verifierad sammanslagning – 2026-11-03
- Flyttade analys-/portföljverktyg fungerar från repot. Portföljstatus är identisk och samtliga 50 bets-rader är oförändrade; bets-schema återställt i tillfällig tabell. Ingen bokföring eller testsändning utförd.
- Gamla tre projektmappar är markerade som arkiv med tidigare instruktioner bevarade. Endast manuell projektlisteändring återstår enligt docs/consolidation.md.

- Verifiering efter flytt: 66 Python-tester och 24 Node-tester passerar, inklusive befintlig MATCH_LOOKUP i sessionens tillfälliga tabeller. bets återställdes separat som tillfällig tabell med 36 kolumner; 50 riktiga bets-rader och portföljstatus är oförändrade.
- Den flyttade bildrenderaren är också provkörd från repot med Pillow 13 i ignorerad lokal .venv. Historiska top10-underlag har kopierats till Git-ignorerade analysis/; originalen i iCloud är orörda.
