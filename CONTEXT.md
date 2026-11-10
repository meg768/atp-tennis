# Projektkontext

## Backtest med TA-gräns – 2026-11-10
- En fast insats på 100 kr när spelarens sparade TA-odds var strikt under 1,80 gav −1 217 kr netto på 70 spel (−17,39 %) med avräkning till sparat Oddset-pris. Urvalet täcker 29 oktober–8 november. Stockholmsraderna saknade sparade TA-odds vid uttaget. [Backtestrapport](analysis/backtest-ta-under-1-80-2026-11-10/rapport.md)

## Driftsättning av spelarporträtt – 2026-11-09
- `atp-service` läser `headshots/<ATP-ID>.png` vid varje anrop. För en ny bild räcker det att uppdatera körkopian på pi-kato och verifiera bild-API:t. För Leo Borg (`B0JG`) gav API:t HTTP 200 med rätt PNG direkt efter fast-forward, med samma tjänste-PID.

## Daglig matchanalys – 2026-11-08
- ”Skicka dagens ATP-analys” är aktiv i ChatGPT på Mac mini, lokalt i projektet atp-tennis, varje dag kl. 08.15 Europe/Stockholm. Analysen och Apple Mail körs där. Utskicket använder den separata analyslistan och har en datumspärr. Pi-kato ska inte ingå i arbetsflödet för analysmejlet.
- Analysjobbet, dess körmiljö och anslutningsfiler togs bort från pi-kato. Den förnyade Codex-sessionen loggades ut. PM2:s driftlista, sparade lista och reservkopia verifierades.

## Gruppformat för analysmejl – 2026-11-08
- Formulera analysmejl för en grupp läsare. Börja med en neutral rubrik, till exempel ”Dagens analys”, följd av slutsatsen.
- Använd den lokala mottagarlistan `~/.config/atp-tennis/analysis_email_recipients.json` för beställda analysutskick. Listan är separat från portfölj-pingets mottagare.

## Oddsets matchvinnarregel i tennis – 2026-11-05
- Svenska Spels spelregler v2.2, avsnitt C.27.2, verifierades för favoritsimuleringen. Minst ett färdigspelat set krävs. Vid avbrott efter det räknas den som går vidare som vinnare. Avbrott före avslutat första set och walkover ger återbetalning i simuleringen. Källa och tillämpning finns i [backtestrapporten](analysis/backtest-favorites-2026-11-05/rapport.md).

## Presentation av matchanalyser – 2026-11-05
- Börja med en kort slutsats som skiljer bästa oddsvärde från mest sannolik vinnare. Lägg matchdetaljer, modell och källor efteråt, även i beställda analysmejl.
- Bedömningen för Paris-kvartsfinalerna den 6 november finns i [matchanalysen](analysis/paris-2026-11-06/analys.md).

## Separat körkopia för ping – 2026-11-04
- Pingprojektets aktuella lokala instruktioner på Mac mini använder `/Users/magnus/atp-ping/runtime`. Före ping körs `/Users/magnus/atp-ping/prepare_runtime.sh` exakt en gång; lyckad fetch krävs före återställning av enbart körkopians spårade filer. Ingen `git clean`. Detta ersätter äldre pull-krav för ping; utvecklingskopian lämnas orörd av ping.
- Vid manuellt löst Git-blockering säkerhetskopierades Mac minis tre lokalt ändrade instruktionsfiler till `/Users/magnus/atp-ping-backups/20261104T224036`. Motsvarande aktuella beslut fanns på origin; utvecklingskopian uppdaterades därefter med fast-forward och verifierades ren.

## Separat ping-projekt på Mac mini – 2026-11-04
- Automationens instruktioner ska vara läsbar svenska med åäö och tydliga stycken.
- Före varje manuellt eller schemalagt ping på Mac mini krävs lyckad `git -C /Users/magnus/GitHub/atp-tennis pull --ff-only`. Läs om uppdaterade instruktioner efter pull. Vid fel stoppas pinget före bokföring/utskick; ingen automatisk stash, reset eller konfliktlösning och ingen körning med gammal kod.
- Magnus vill köra portfölj-ping och hantera dess schemaläggning i ett separat lokalt projekt på Mac mini. ATP Tennis här är fortsatt hem för gemensam kod, analys och backtesting; ingen ping-schemaläggning ska skapas eller aktiveras här. Detta är ett uttryckligt undantag från det tidigare beslutet om ett enda aktivt projekt.
- Behåll befintlig daglig tid 09.00 Europe/Stockholm och samma bets-bokföring och ping-rutin. Återanvänd befintliga verktyg utan en andra oddsinsamlare. Vid flytt ska den gamla Mac mini-automationen flyttas eller pausas så att endast en är aktiv.
- Projektmappen `/Users/magnus/atp-ping` är skapad och registrerad som lokala Codex-projektet `atp ping` på Mac Mini 2026, med egna instruktioner och länkar till huvudrepots scripts, docs, tracking och .agents. Befintlig heartbeat `atp-ping-var-sj-tte-timme` är ACTIVE med oförändrad daglig tid 09.00. Dess befintliga målchatt `01a16aca-092b-77b0-9ccf-7ab6b7b519df` har flyttats till ping-projektet och prompten anger den separata arbetsmappen. Ingen extra automation skapad.
- Statusläsning från båda projektmapparna gav identisk portföljkontrollkod `6171efac4fb5dd17`. Ingen pingkörning, bokföring eller notifiering gjordes vid installationen.
- Chatten körs på MacBook Air och dess befintliga ping-automation är verifierat PAUSED. SSH till Mac Mini 2026 fungerar som `magnus@mac-mini-2026.local`, verifierat 2026-11-04 med befintlig nyckel och känd värdnyckel. Registrering och automationsändring gjordes via skärmdelning i Mac minis Codex-app.

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

## Backtest – 2026-11-03
- Första favoritsimuleringen finns i analysis/backtest-favorites-2026-11-03/: 100 kr på den lägre av de två sparade Oddset-priserna. Endast entydigt kopplade Completed-matcher avräknas; lika odds, avbrott och saknade resultat särredovisas. Detta är analys och skriver aldrig till bets.
- Alternativ simulering i samma analysmapp: Magnus bad om insats 100/(odds−1), för att vinna 100 kr netto per vunnen match. Gäller endast backtestet; portföljens ordinarie 100 kr-insats ändras inte.
- TA-varianten väljer lägst historiskt sparat TA-odds men använder Oddsets erbjudna pris för insats/avräkning, utan EV-filter. Saknad TA hoppas över; lika Oddset-priser hindrar inte ett entydigt TA-val. Rapport: ta-target-profit-report.md i samma backtestmapp.
- Nästa backtestvariant prövar båda spelarna och väljer endast strikt TA < samma spelares Svenska Spel-pris, oavsett favoritstatus. Behåller målet 100 kr nettovinst vid vinst; sparat i ta-price-filter-report.md i samma analysmapp.
- TA < Svenska Spel har även körts med fast 100 kr per match och identiska spelarval: ta-price-filter-flat-report.md. De olika insatsmodellerna sparas separat så att tidigare simuleringar bevaras.

## Portföljsimulering – 2026-11-04
- Aktuella pappersseriens 20 avgjorda spel har simulerats med insats 100/(låst odds−1), mål 100 kr nettovinst per vinst. Rapport och reproducerbar läsande beräkning finns i `analysis/portfolio-target-profit-2026-11-04/`. Samma bokförda utfall och avbrottsbedömningar används. Detta ändrar inte portföljens ordinarie 100 kr-insats eller historik.

## Körmaskin för dagligt ping – 2026-11-03
- Det dagliga portfölj-pinget kl. 09.00 Europe/Stockholm ska köras på Mac mini. Magnus visade en skärmbild där Mac mini rapporterar aktiv automation och verifierad åtkomst. MacBook Airs motsvarande automation (atp-ping-var-sj-tte-timme) är nu pausad och statusen verifierad lokalt, så den inte kör parallellt. Manuella ping kan fortsatt göras från projektet.
