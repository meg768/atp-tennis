# Daglig uppföljning av bettingtips

Pappersportfölj: 100 kr per singelspel. Ingen faktisk spelplacering. Serien startade med ett manuellt svep på Magnus begäran 21 oktober 2026 kl. 18.25 svensk tid. Första ordinarie morgonkörningen är 22 oktober 2026 kl. 07. Tidigare tips och hypotetiska räkneexempel i chatten ingår inte i denna framåtriktade serie.

## Morgonens urval

Arbeta i projektmappen ATP Tennis och läs CONTEXT.md. Hämta aktuell svensk tid med Europe/Stockholm; datum och scheman följer svensk tid även när sommartiden växlar.

Utgå från direkt MariaDB via scripts/database.py och .venv/bin/python. Läs .env enbart genom den befintliga anslutningen och visa inga hemligheter. Databasen används endast för läsning. HTTP är reservväg; upptäck aktuella endpoints via GET /api/meta/endpoints. Aktuella Svenska Spel-priser och matchstatus kommer från https://tennis.egelberg.se/api/oddset.

Populationen är dagens ATP-herrsingel på huvudtouren (ATP-250, ATP-500, Masters, Grand Slam), endast ännu ej påbörjade matcher med verifierat underlag, spelarnas ATP-ID och giltiga positiva odds > 1.00. Uteslut dubbel och Challenger. Urvalet täcker endast matcher tillgängliga vid uttaget och efter körningen, inte alla matcher ett globalt tennisdygn. Saknas utbud eller underlag ska det redovisas, utan påhittade tips.

Hämta TA- och GPT-odds från CALL PLAYER_ODDS(A,B,surface). Dessa inkluderar redan 5 % sannolikhetspåslag: jämför direkt med Svenska Spels priser. Gör inget extra marginalpåslag och anpassa inte till Svenska Spels exakta överrundning. Separat marginfri TA-sannolikhet hämtas med WIN_PROBABILITY_TA för modell-EV = p * SS-odds - 1. Ett odds-prisgap är inte EV.

Grundmetod v1: screena samtliga berättigade matcher, sortera kandidatsidor efter TA-modell-EV, och kontrollera GPT-utfall, aktuell form, motstånd och tillgänglig fysisk information. Välj de tre starkaste spelvärdena efter denna kontroll, högst en sida per match, och dokumentera varför större modellgap eventuellt väljs bort. Kräv positiv TA-modell-EV för rekommendation. Om färre än tre kandidater återstår, redovisa färre och skälet i stället för att tvinga fram negativa modellvärden. Det slutliga urvalet är en bedömning, inte en strikt mekanisk topp tre. Ändra inte grundmetoden tyst; versionsmärk eventuella framtida ändringar.

Tennis Abstract får komplettera databasen när relevant data saknas eller behöver kontrolleras. Ange då konkret vilka uppgifter som kommer därifrån, URL och källdatum, både i logg och presentation. TA och GPT är inte oberoende modeller. Skapa inte en säker rekommendation av ett modellgap med uppenbart inaktuella eller otillräckliga data.

Kontrollera status och pris på nytt före publicering. En match som börjat får inte ingå. Spara först hela oddssnapshoten samt screening och bedömning. Skapa därefter dagens picks.json atomärt med exklusiv filskapning; finns filen redan får inget nytt dagsurval skapas eller originalet ersättas. Ändra aldrig spelare, insats eller publicerat odds efter att dagens urval låsts. Om en match flyttas följer samma spel med tills det kan avgöras; lägg inte till ett ersättningsspel efteråt.

## Lagring

Skapa en mapp per urvalsdatum: days/YYYY-MM-DD/.

- odds-snapshot-TIMESTAMP.json: rått flöde, uttagstid med tidszon och källa.
- screening.json: berättigade matcher, procedurresultat, marginalfria sannolikheter, urval och skäl.
- picks.json: låst dagsurval med schema_version=1, strategy_version=1, selection_date, selected_at, timezone=Europe/Stockholm och picks-lista. Varje rad har pick_id, oddset_match_id, tournament, surface, scheduled_start, player_id, player_name, opponent_id, opponent_name, ss_odds, ta_odds, gpt_odds, ta_probability, stake_sek=100, rationale och sources. Spara även datum med tom lista och skäl; inga nya efterhandsval senare samma dag.
- settlement-events.jsonl: append-only händelser med pick_id, checked_at, status (pending/won/lost/void/review), payout_sek om avgjort, score, source och source_match_id. Väsentliga korrigeringar läggs som nya händelser med motivering; tidigare händelser raderas inte. Senaste händelsen per pick_id gäller.
- report.md: läsbar aktuell rapport för just urvalsdatumet. Den får uppdateras med senare resultat.

Uppdatera dessutom overview.md från den fullständiga loggen, med dagstabell och totaler. Kopiera inte bara tidigare rapporters summeringar: räkna alltid från de låsta spelen och senaste avräkningshändelsen per spel. Undvik dubbla event vid oförändrad kontroll.

## Avräkning och resultat

Kontrollera alla öppna spel, även från tidigare datum. Matcha med båda ATP-ID, turnering, omgång om tillgänglig och rätt turneringsupplaga; event.date är turneringens start, inte säkert matchdagen. Matchens försvinnande från Oddset-flödet bevisar inte resultat. Använd databasens verifierade slutresultat först, och vid importfördröjning officiell ATP/arrangörskälla med tydlig källangivelse. En osäker matchkoppling förblir öppen.

För en normalt färdigspelad match: vinst ger utbetalning 100 * låst SS-odds; förlust ger 0. Nettot är utbetalning minus insats: exempelvis odds 1.53 ger +53 kr vid vinst och -100 kr vid förlust. Räkna med Decimal och avrunda penningbelopp till ören.

Walkover, avbruten match, diskvalifikation eller annullering kräver kontrollerad tillämplig avräkningsregel hos Svenska Spel eller verifierad avräkning. Härled inte spelutfallet enbart från registrerad officiell vinnare. Om det är oklart: status review, utan påhittad utbetalning. Bekräftat void-spel återbetalar insatsen och ger netto 0 kr. Pågående, uppskjutna och obesvarade matcher är pending och räknas inte som förluster.

Rapportera per urvalsdatum: varje match, låst odds, insats, resultatstatus, utbetalning och netto. Summera registrerade insatser, utbetalningar och realiserat netto för avgjorda spel; visa separat hur många spel och hur stor insats som fortfarande är öppna. Märk dagsresultatet preliminärt tills allt är avgjort. En senare avräkning uppdaterar ursprungligt urvalsdatum, inte bara kontrollens kalenderdag.

Totalerna visar avgjorda vinster/förluster, träffprocent wins/(wins+losses), totalt realiserat netto och ROI = netto / summa insatser på won/lost-spel. Void exkluderas från träffprocent och ROI-underlaget; pending/review exkluderas också. Noll avgjord insats ger ROI ej beräkningsbar. Visa samtliga belopp i kronor och håll pappersresultat tydligt åtskilda från faktiska användarspel.

## Presentation vid schemalagda körningar

Kör en gång per dygn, kl. 07 Europe/Stockholm. Kontrollera först föregående dags spel och eventuella äldre öppna spel. Rapportera gårdagens utfall och netto, eventuella äldre nya avräkningar samt ackumulerat resultat. Skapa därefter dagens tre tips enligt ovan i samma rapport. Matcher som ännu inte kan avgöras hålls öppna till nästa dags körning. Vid försenad körning används aktuell svensk dag och endast återstående matcher. Om körningen missas får den inte konstruera historiska spel i efterhand. Vid dataproblem, rapportera det och behåll befintlig logg intakt. Alla rapporter ska vara korta och på svenska.
