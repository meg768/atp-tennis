# ATP Tennis Betting

## Grundlagring från 31 oktober 2026 – gäller framför äldre filhänvisningar

Endast `bets` lagrar bettingdata. De vanliga kolumnerna ger spel, odds,
sannolikheter, beslut, resultat och ekonomi. `data` är en begränsad JSON-historik
för ursprungliga analyser, kandidatbedömningar, odds, avräkningar och kommentarer.
Inga dokumentarkiv, säkerhetskopior, mejl, kvitton, bilder, PDF eller färdiga
rapporter får lagras. Historiska prognoser och låsta odds får inte skrivas över.

Börja ping med `python3 scripts/portfolio_status.py`. Alla äldre JSON-sökvägar
nedan är API-nycklar till fundamental data i `bets`, inte lokala filer.
`from scripts.betting_data import request`; läs med `request('read', prefix='tracking/')`.
Spara ett färdigt ping i en transaktion med `request('write', documents={...})`:
`tracking/bets.json`, tillagda `tracking/settlements.jsonl`,
`tracking/checks/<ping>.json`, `tracking/retrospectives.json` och analysens
`assessment.md`, `candidate-decisions.json`, `final-odds.json`, `ta.json`, `events.json`.
Oddsunderlaget begränsas automatiskt till matchvinnarmarknader. Övriga råa
leverantörssvar och arbetsunderlag används i minnet, aldrig som permanent arkiv.
Varje kandidat ska ha tidsstämpel, båda ATP-ID, namn, turnering, underlag,
observerade odds, egna sannolikheter/spelgränser när de bedömts, analys, risk och
beslut. Saknade uppgifter ska vara NULL, aldrig påhittade.

Bortvalsloggningen följer befintlig rutin och läser dessa kompakta underlag från
`bets`. Matchstatus och resultat följs upp även för bortval. Dubblettskydd,
100 kr per spel, tiogräns och resultatberäkning är oförändrade.

`tracking/overview.md` skapas vid läsning från spel och utfall och lagras aldrig.
Övriga rapporter, bildprompter, affischer och utskicksbilagor skapas tillfälligt.
Spara inte bild- eller mejlmetadata i databasen. Mejladresser är programkonfiguration
i `scripts/storage_policy.py`. Apple Mail-rutinen är oförändrad. Endast en minimal
teknisk sändningsspärr per ping finns för att förhindra dubbla utskick, inga kvitton.
Ta bort tillfälliga bildfiler efter användning. Ingen lokal bettingdatakälla finns.

Följ urvalsmetod och mejlformat nedan. Daglig körning är fortsatt kl. 09.00
Europe/Stockholm. Stoppa vid databasfel; använd ingen lokal reserv.
Portföljdata läses alltid från bets; AGENTS.md styr arbetssätt och CONTEXT.md innehåller projektbeslut.

Pappersportföljen är ett arbetsflöde i det gemensamma ATP Tennis-projektet.

## Samma bokföring på båda Macarna

Databasen ger samma bokföring och kontrollkod på båda Macarna.
`python3 scripts/portfolio_status.py --json` ger maskinläsbar status utan att
ändra data eller skicka mejl. Följ datakällans anvisningar ovan vid varje ping.

Projektet avser enbart simulering: en pappersportfölj. Från Magnus instruktion
den 26 oktober 2026 ska faktiska spel inte beaktas eller redovisas i ping,
mejl, affischer, översikter eller statistisk analys. Äldre uppgifter om verkliga
insatser är historisk metadata och ingår inte i beräkningar. Detta ersätter
äldre instruktioner om separat faktisk uppföljning, även i CONTEXT.md.

## Datakällor

Använd inte `tennis.egelberg.se`: varken för data, som reservväg eller för
drift och schemaläggning. Använd den gemensamma skillen **atp-tennis** för all
databasåtkomst och hämtning av Svenska Spels odds. Skillen läser MariaDB och
hämtar odds direkt från leverantörsflödet utan webbläsare. Matchprogram, underlag
och färska resultat från ATP, arrangören eller Tennis Abstract.
Direktåtkomst till dessa externa källor måste verifieras innan de används.
Historiska filer behåller sin ursprungliga källangivelse, men snapshots från
den förbjudna tjänsten får inte återanvändas som nytt analysunderlag.

## Huvuduppgift

Kunna svara på: **”Vilka kommande matcher är värda att satsa på?”**

Målet är att över tid följa resultatet av egna matchanalyser med TA-odds som
vägledning. Urvalet ska bygga på en självständig bedömning av spelarnas chans
att vinna till erbjudet odds. Resultatet av serien utvärderar denna samlade
metod; det kan inte ensamt visa effekten av TA-modellen isolerat.

Svaret ska ge upp till tio motiverade singelspel i olika kommande ATP-matcher,
med matchstart i svensk tid, spelare, aktuellt Svenska Spel-odds, TA-odds,
bedömd lägsta spelgräns och viktigaste osäkerhet. Välj efter spelvärde vid
erbjudet odds och en samlad bedömning av matchen.

Arbetsgång:

1. Hämta aktuellt utbud med skillens `scripts/svenskaspel.py`. Använd
   huvudtourens herrsingel, verifiera underlag och båda ATP-ID och uteslut
   påbörjade matcher. Alla spelbara, ej påbörjade ATP-matcher i aktuellt
   utbud kan övervägas oavsett hur långt fram de ligger. Kräv verifierad
   planerad start efter bokföringstillfället; uteslut matcher utan verifierbar
   framtida starttid.
   Ange vilka datum och matcher urvalet täcker.
2. Hämta endast TA-underlaget via skillens `scripts/database.py`; hoppa över databasens
   GPT-odds helt. `WIN_PROBABILITY_TA(A,B,surface)` ger marginalfri sannolikhet
   `p`. Motsvarande TA-pris är `ROUND(1 / LEAST(0.999, GREATEST(0.001, p * 1.05)), 2)`
   enligt databasens befintliga prissättning. För andra sidan används `1-p`.
   TA-oddsen inkluderar redan 5 % sannolikhetspåslag och jämförs direkt med
   Svenska Spels odds; lägg inte på ytterligare marginal. Undvik
   `PLAYER_ODDS`, som även beräknar GPT-oddsen.
3. Använd TA som vägledning, inte som ett mekaniskt urval efter största
   oddsgap. Om TA-modell-EV redovisas beräknas den med den marginalfria
   sannolikheten: `p * spelodds - 1`. Ett odds-prisgap är inte förväntad
   avkastning och TA-modellens sannolikhet är inte automatiskt egen bedömning.
4. Granska aktuell form, motståndets kvalitet, underlag och relevant fysisk
   information och analysera matchbilden. Komplettera med aktuella externa
   källor vid behov. Motivera val och osäkerhet självständigt; ett stort
   TA-gap räcker inte som rekommendation.
5. Välj högst en sida per match med positivt bedömt spelvärde enligt den egna
   analysen. TA-modell-EV är ingen obligatorisk urvalsgräns. Redovisa färre
   än tio spel om underlaget inte motiverar tio. Skilj modellvärden från egen
   bedömning och ange hur den bedömda spelgränsen har satts.
6. Kontrollera odds, verifierad framtida starttid och ej påbörjad status igen
   direkt före bokföring och före svaret. Ange uttagstid,
   källor och databegränsningar. Spara oddsunderlag och beräkningar vid analys.

Historik och modellvärden läses direkt från databasen. Hämta kompletterande
turneringskalender och lottningar direkt från ATP, arrangören eller Tennis
Abstract. Saknas verifierade aktuella odds eller matchstatus ska detta
redovisas; ge inga nya tips baserade på gamla priser.

Tidsregeln ovan gäller både manuella och schemalagda ping från och med
25 oktober 2026 och ersätter alla äldre 24-timmarsbegränsningar, även i
`CONTEXT.md`. Det finns ingen övre tidsgräns för matchstart.

## Speluppföljning

Från 31 oktober 2026 loggas även samtliga granskade matcher som väljs bort,
med då observerade odds och en konkret motivering. Bortval sparas både i
`tracking/declined_matches.jsonl` och i databasens `bets` med status `declined`
och insats 0 kr. De ingår inte i pappersportföljens antal spel, öppna insats,
vinster/förluster eller ROI. Följ rutinen i `tracking/README.md` vid varje ping.

Vi följer rekommendationerna som simulerade singelspel med 100 kr per match.
Öppna spel visas som en lista, inte som fack som ska fyllas. Granska alla
spelbara, ej påbörjade ATP-matcher och välj bara dem som uppfyller samma
urvalskrav som tidigare. Högst tio pappersspel får vara öppna samtidigt;
taket är inget mål och någon miniminivå finns inte. Ingen dygnsgräns eller
övre tidsgräns för matchstart gäller. Varje spel är fortsatt 100 kr.
Pågående, uppskjutna och oklart avgjorda spel ingår i de tio öppna spelen.
Bokförda val och låsta odds ligger fast till avräkning.

Sortera listan efter senast verifierad matchstart, tidigast först, i svensk
tid. Flyttade matcher får ny placering men ursprungliga tider bevaras.
Okänd aktuell starttid visas sist och märks som okänd. Använd samma ordning
i chatt, mejl och affisch. Inga tomma fack eller ”Ledigt”-rader visas.
Om fler kandidater kvalificerar sig än taket tillåter, prioritera nya val
utifrån bedömt spelvärde och osäkerhet och dokumentera de kvalificerade
kandidater som föll bort på grund av taket. Ersätt inte befintliga spel.
Oförändrat läge ger en kort statusrapport, inga nya spel.
Låsta odds och insatser finns i `tracking/bets.json`; matchutfall och netto
sammanställs i [tracking/overview.md](tracking/overview.md).
Avräkningsregler och loggformat beskrivs i [tracking/README.md](tracking/README.md).
Uppföljningen görs vid manuellt ping och, på Magnus uttryckliga begäran den
31 oktober 2026, automatiskt varje dag kl. 09.00 i svensk tid
(Europe/Stockholm). Automationen ”ATP-ping dagligen 09.00” kräver att Macen är
vaken och uppkopplad med appen igång. Bettingdata läses direkt från databasen;
program och skills finns lokalt.
Efter varje ping skickas en affisch som mejlbilaga via **Apple Mail**
till mottagarna i `tracking/email_recipients.json`: **magnus.egelberg@gmail.com**
och **magnus@egelberg.se**
med rubriken ”Speltips” och en flexibel datumordnad lista över öppna spel:
spelare, låst Svenska Spel-odds jämfört med TA-odds vid bokföringen,
diff i implicerad sannolikhet (procentenheter), insats och starttid. Nya spel markeras, pågående matcher visar tillgänglig ställning och
oklar status anges uttryckligen. Affischen visar också antal avgjorda matcher
och totalt antal bokförda spel i aktuell serie. Varje ping motiverar samtliga aktiva spel, även när inga nya spel bokförts.
Mejlet visar ett tydligt avsnitt per match med låst odds, insats, ursprunglig
motivering från `rationale` och sparade osäkerheter från `risk`.
Långa texter delas i kortare stycken utan att den bokförda bedömningen ändras.
Mejlets ämne är ”ATP Speltips”. Affischen visas först som inbäddad bild,
följd av formaterade kommentarer med större, feta matchrubriker, feta
underrubriker och korta stycken. Brödtexten är 15 pt för god läsbarhet.
Utskicket görs enbart via AppleScript utan UI-styrning eller klickande;
Mail får köras i bakgrunden. Ingen separat HTML-mall eller SMTP behövs.
Kommentarerna inleds med ”Mina bedömningar”.
Mejlet innehåller affischen och kommentarer till aktuella öppna spel.
Resultathistorik och efterhandskommentarer ingår inte i mejlet; de finns
kvar i projektet för uppföljning och analys.
Rutinen och skyddet mot dubbla
utskick beskrivs i `tracking/README.md`.

## Gemensamma verktyg

Databasanslutning, Svenska Spel-flöde, Python-beroenden och lokal konfiguration
hanteras av den gemensamma skillen `atp-tennis`.
Hitta den installerade skillens katalog via den aktuella skillförteckningen;
`~/.agents/skills/atp-tennis` kan vara en länk till den. Läs dess `SKILL.md`
och relevanta referenser före användning. Python-miljön finns lokalt på varje
Mac i `~/.local/share/codex/atp-tennis/venv` och databasuppgifterna i
`~/.config/atp-tennis/.env`, enligt skillens aktuella instruktioner.
Projektet har ingen egen anslutningskod, `.env` eller Python-miljö.

Läs en SQL-fråga från standard input eller en fil med skillens Python:

```sh
echo 'SELECT 1 AS connection_ok;' | ~/.local/share/codex/atp-tennis/venv/bin/python ~/.agents/skills/atp-tennis/scripts/database.py
~/.local/share/codex/atp-tennis/venv/bin/python ~/.agents/skills/atp-tennis/scripts/database.py query.sql
```

Hämta aktuellt oddsunderlag utan webbläsare:

```sh
~/.local/share/codex/atp-tennis/venv/bin/python ~/.agents/skills/atp-tennis/scripts/svenskaspel.py
```

Skillens databasverktyg använder en lästransaktion. Vid saknad skill eller
utebliven datakontakt: redovisa felet. Skapa ingen lokal reservanslutning och
öppna inte Svenska Spel i webbläsaren som automatisk reservväg.

Spelurval, bokföring, avräkning och historik hör fortsatt till detta projekt.
Analyskatalogernas engångsskript anropar skillens verktyg och ska köras med
skillens Python om de behöver granskas. De innehåller historiska datum och
urval; kör inte gamla registreringsskript igen. Sparade analyser, rådata och
spelloggar är underlag för efteranalys och ska bevaras.

Äldre hänvisningar till projektets `scripts/database.py`, `.env` eller
`.venv` i sparad kontext och historiska rapporter avser den tidigare lösningen.
Använd alltid skillens verktyg enligt instruktionerna ovan.
