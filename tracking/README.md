# Portföljrutiner

GitHub-lagring 2026-11-03: daterade läsande kopior av godkänd analys- och pappersportföljhistorik får versionshanteras i data/snapshots/ och analysis/. Produktionsbokföring läses och skrivs fortsatt endast genom bets. Detta är ingen lokal reservdatakälla och medför inga nya spel eller utskick.

Den aktuella grundlagringen nedan har företräde framför äldre filhänvisningar: tracking/*.json är databasnycklar, inga lokala produktionsfiler. Rapportmaterial och bildprompter lagras aldrig i bets. Historiska råarkiv får inte återanvändas som nya priser. Vanlig analys och backtesting startar aldrig ping eller utskick.

# Uppföljning av rekommenderade spel

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
Portföljdata läses alltid från bets; AGENTS.md och CONTEXT.md styr projektet.

Pappersportfölj med 100 kr per rekommenderad match. Detta är simulerade spel
till publicerade odds, inte bekräftade spel hos en speloperatör. Serien är
separat från den tidigare loggen i `atp-tennis-chat`.

Spelloggen nollställdes senast på Magnus uttryckliga begäran den 22 oktober 2026
kl. 00.01 svensk tid. Den tidigare serien finns i `archive/20261022T000128+0200/`
och ingår inte i den nya seriens saldo. Aktuellt innehåll finns i
`bets.json` och senaste avräkningarna. Återför inte gamla spel eller
kontrollhistorik automatiskt från arkivet eller gamla analysfiler. Äldre
affischer visar den tidigare serien.

## Ping och listan över öppna spel

Börja varje ping med `python3 scripts/portfolio_status.py` och kör läskontrollen
igen när pingdata sparats. Databasen är gemensam för båda Macarna. Äldre
chattkontext får aldrig ersätta bokföringen. Automationens ordinarie ping körs
kl. 09.00 svensk tid. Macen behöver vara vaken, uppkopplad och ha appen igång.
Använd aktuell installerad `atp-tennis`-skill och dess lokala miljö.

Från Magnus beställning den 26 oktober 2026 används en lista med högst tio
samtidigt öppna pappersspel, 100 kr per spel. Detta ersätter fackmodellen och
femgränsen. Ingen dygnsgräns gäller. Urvalskraven är oförändrade: egna analyser
med TA som vägledning, motiverat spelvärde och verifierat underlag. Taket är
inte ett mål och listan behöver inte fyllas.

Listan sorteras efter senast verifierad matchstart, tidigast först, i svensk
tid. Flyttad match ändrar placering, inte ursprunglig bokföring eller låsta
odds. Okänd aktuell starttid placeras sist och anges uttryckligen som okänd.
Samma ordning gäller chatt, mejl, affisch och den öppna listan i översikten.
Pågående, uppskjutna och oklart avgjorda spel räknas som öppna. Om fler nya
kandidater kvalificerar sig än det finns utrymme för, prioritera spelvärde
och osäkerhet och dokumentera kvalificerade bortval på grund av taket.
Befintliga spel byts aldrig ut för att nyare kandidater ser bättre ut.

**”Kommande” betyder ett redan bokfört pappersspel på 100 kr till låst odds.**
I rapporter ska statusen skrivas **”Spel bokfört – inväntar matchstart”**,
med insats och låst odds bredvid.
Spelet räknas som öppet och insatsen ingår i öppen insats redan före matchstart.
När matchen börjar ändras matchstatus till ”Pågående”; registrera inte ett
nytt spel och dra inte insatsen igen. En kandidat som ännu inte bokförts får
inte visas som ”Kommande” i listan över bokförda spel.

1. Läs samtliga registrerade spel och senaste avräkningshändelse per spel.
   Ett spel utan avräkning är öppet. Kontrollera alla öppna matcher mot
   aktuella resultat och matchstatus.
2. Avräkna verifierat avgjorda spel och lägg till nya händelser. En pågående,
   kommande, uppskjuten eller ännu oklar match ligger kvar i listan.
   Även `review` räknas som öppet tills avräkningen är klar.
3. Granska alla spelbara matcher efter egen analys enligt projektets README.
   Lägg endast till kvalificerade val och högst så många att tio spel är öppna
   samtidigt. Sänk inte kraven för att fylla listan. Nya spel måste ha verifierad
   planerad start efter bokföringstillfället, och matchen får inte ha börjat.
   Alla spelbara, ej påbörjade ATP-matcher i aktuellt utbud kan övervägas,
   oavsett hur långt fram de ligger. Kontrollera odds, verifierad framtida
   starttid och ej påbörjad status igen direkt före bokföringen. Saknas
   verifierbar framtida starttid eller bra kandidater, avstå nya val. TA är vägledning;
   använd inte databasens GPT-odds. Behåll
   befintliga öppna spel och deras låsta odds även om nya kandidater ser bättre ut.
   Redan bokförda spel ligger kvar även om starttiden flyttas.
4. Lås nya val, odds, 100 kr insats, aktuell tidsstämpel, båda ATP-ID,
   turneringsupplaga, analys och källor före matchstart. Registrera aldrig
   samma matchspel igen. Använd ny aktuell `recommended_at` för nya val.
   Avstå nya val om verifierade priser
   eller tillräckligt bra kandidater saknas; redovisa varför.
5. Visa kort de upp till tio öppna spelen i datumordning med status kommande/pågående/
   uppskjuten/oklar, starttid i svensk tid, låsta odds och insats. Visa nya
   avräkningar med slutresultat och netto, motivera eventuella nya val och
   redovisa ackumulerat netto och öppen insats.
6. Skicka ett mejl för detta ping enligt rutinen nedan.

Tidsregeln gäller både manuella och schemalagda ping från och med
25 oktober 2026 och ersätter alla äldre 24-timmarsbegränsningar, även i
`CONTEXT.md`.

## Logga även bortval – 31 oktober 2026

Vid varje ping ska `analysis/<pingets tidsstämpel>/candidate-decisions.json`
innehålla samtliga granskade matchpar, även bortval, med båda ATP-ID,
matchnamn, leverantörens match-ID (`offering_id`), observerad start och status,
båda sidors odds, TA-sannolikhet för första spelaren, `decision` (`booked`
eller `declined`) och konkret `reason`. Spara egna sannolikheter och
spelgränser som strukturerade värden när de faktiskt har bedömts; hitta
inte på saknade värden. Ange turneringsupplaga och underlag när verifierade.
Spara tillhörande `final-odds.json`, `ta.json` (båda ID och namn) samt
`events.json` med turneringsmetadata enligt befintligt analysformat.

Efter sparad kontrollfil, före mejlförsöket, kör skillens lokala Python:

```sh
<skillens-python> scripts/log_declined_matches.py tracking/checks/<ping>.json --skill-dir <installerad-atp-tennis-skill>
```

Skriptet lägger bortvalen i `tracking/declined_matches.jsonl` och i
databasens `bets`. Samma sparade beslut loggas inte två gånger. Uppdaterade
bedömningar bevaras i historiken. En befintlig bokförd match skrivs aldrig
över av ett bortval. Rapportera databasfel; samma kontroll kan användas för
att slutföra databasloggningen utan dubbla poster eller mejlutskick.

I en bortvalsrad betyder `player` och `opponent` analysens spelarordning,
inte att en sida valts för spel. `odds` och sannolikhetskolumnerna avser
första spelaren; båda sidors priser och hela beslutet bevaras i historiken.
`rationale` förklarar bortvalet. `recommended_at` är NULL, `registered_at`
är loggningstid och `checked_at` är den ursprungliga bedömningens tid.
Okända turnerings-ID eller underlag är NULL, inte gissade.

`status='declined'` och `stake=0` är obligatoriskt för bortval. De ska inte
läggas i `bets.json`, avräknas, ta en av de tio platserna eller räknas in i
spelstatistik. Databasens spelöversikter ska filtrera med
`WHERE status <> 'declined'`; visa bortval separat. Bortval ingår inte i
affisch eller spelkommentarer i mejlet. Logga även orsaker som osäkra data,
otillräckligt pris eller tiotaket, men skapa inga historiska bedömningar
utan daterat sparat underlag.

Om en tidigare bortvald match senare bokförs ska databasraden återanvändas
med det då låsta spelets värden, insats och vanliga spelstatus. Bevara de
tidigare bortvalen i `history`; skapa inte ett andra spel-ID för samma match.
Detta får ske först efter normal kontroll och bokföring före matchstart.
Sporttabellerna och den gemensamma skillens läsverktyg förblir oförändrade;
skrivningen använder bara projektets enda bettingtabell `bets`.

## Nya spel utan dygnsgräns

Magnus tog bort dygnsgränsen den 26 oktober 2026. Detta ersätter alla äldre
begränsningar av antal nya spel och nya insatser per kalenderdag.
Alla spelbara, ej påbörjade ATP-matcher i aktuellt utbud får väljas oavsett
hur långt fram matchstarten ligger. Välj efter egen analys och spelvärde.

Antalet nya spel begränsas av urvalskraven och taket på tio samtidigt
aktiva spel. Varje spel är fortsatt 100 kr. Efter avräkning får nya kvalificerade val
bokföras samma dag. Kontrollera antalet öppna spel, dubbletter, odds,
verifierad framtida starttid och ej påbörjad status igen direkt före sparandet;
utför inte flera registreringar parallellt. Avstå nya val när analys
eller verifierade data inte räcker. Nollställ inte spelloggen vid dygnsskifte
och skriv inte om tidigare registreringar.

För utvärderingen behålls de ursprungliga Svenska Spel-oddsen, TA-sannolikhet
och TA-odds, egen sannolikhetsbedömning, spelgräns och motivering före start.
Följ sedan alla resultat, netto, ROI och antal avgjorda spel enligt reglerna
nedan. Resultatet gäller den samlade urvalsmetoden; en begränsad serie bevisar
inte att TA-modellen eller den egna bedömningen är kalibrerad eller lönsam.

## E-post efter varje ping

Magnus har godkänt en notifiering efter varje manuellt och schemalagt ping. När bokföring
och kontrollfil är sparade: skapa en aktuell affisch med inbyggda imagegen,
spara bild i en tillfällig katalog och granska att uppgifterna
stämmer med detta ping. Skicka sedan via Apple Mail till
mottagarlistan i `tracking/email_recipients.json` med projektets
sammanställningsskript. Listan innehåller **magnus.egelberg@gmail.com** och
**magnus@egelberg.se**. Båda läggs som separata Till-mottagare i samma mejl;
ett försök per ping gäller fortfarande för hela utskicket. Detta ersätter
äldre instruktioner om en enda mottagare, även i CONTEXT.md:

```sh
python3 scripts/notify_new_bets.py tracking/checks/<detta-pings-tidsstämpel>.json --attachment /absolut/sökväg/till/aktuell-affisch.png
```

Kontrollfilen ska innehålla `portfolio_id`, `checked_at`, `bets` med aktuella
observationer och `new_bets` med enbart de spel-ID som bokfördes under detta
ping. Affischen har rubriken **”Speltips”** och visar endast den datumordnade
listan över öppna spel, högst tio, även utan nya val. Inga tomma fack visas.
Numrera affischens spel 1–N i samma datumordning som kommentarerna i mejlet.
Numren är listpositioner, inte permanenta spel-ID. Anpassa layouten till
antalet spel så att texten är läsbar. Rubriken ”Speltips” ersätter tidigare
”Spelstatus” på affischen, även i äldre sparad kontext.
Öppna spel hämtas från kontrollfilens observationer; avräknade spel tar ingen
plats. Namn, låst Svenska Spel-odds, TA-odds vid bokföringen och insats läses
från `bets.json`. Visa Svenska Spel och TA bredvid varandra för varje spel,
med diff `(1/TA − 1/Svenska Spel) × 100` i procentenheter (pp).
TA:s befintliga 5 % marginal behålls; diffen är inte förväntad avkastning.
Visa jämförelsen i både chattrapporten och affischen. Visa turnering,
preliminär svensk starttid och aktuell status: bokfört/inväntar matchstart,
pågående med tillgänglig ställning, uppskjutet eller oklart. Markera nya spel med `[NYTT]`. Dra inte slutsatser om status från
klockslaget. Pappersnetto och öppen pappersinsats visas när de finns i kontrollen.
Visa även ”Avgjorda matcher: N” och ”Totalt bokförda spel: M” för den aktuella
serien. Räkna avgjorda som `won` eller `lost` enligt senaste avräkningen per
spel; öppna spel ingår bara i totalt bokförda. Redovisa eventuella `void`
separat. Räkna varje bokfört pappersspel en gång;
arkiverade serier ingår inte.
Tydliggör att sammanställningen avser pappersportföljen; inga faktiska spel
placeras genom notifieringen. Skicka inte tidigare öppna spel igen som nya
och skapa inga retroaktiva notifieringar för ping före överenskommelsen.

Inför utskicket skapar skriptet automatiskt en separat `*-email.jpg` från
affischens original. Leveranskopian har högst 1200 pixlar på längsta sidan
(normalt 800 × 1200) och högst 500 kB. Originalet används under pinget. Endast den
komprimerade leveranskopian skickas; granska att liten text fortfarande är
läsbar. Detta ersätter tidigare utskick av den okomprimerade PNG-filen.

Skriptet anropar `scripts/send_ping_mail.applescript` via `osascript` och
använder Apple Mails konfigurerade standardkonto. Apple Mail måste vara konfigurerat
för att skicka mejl och macOS måste tillåta skriptets åtkomst till Mail.
Denna beställning ersätter äldre instruktioner om Pushover och att inte skicka mejl,
även i CONTEXT.md. Skicka affischen som bilaga med ämnet ”ATP Speltips”
och placera affischen först som inbäddad bild, före kommentarerna.
Utskicket sker enbart via AppleScript, utan UI-styrning, klick eller
tangentbordsautomation. Mail får köras i bakgrunden. Ingen SMTP-konfiguration
eller separat HTML-mall används.
Använd Apple Mails enkla rich text: brödtext Helvetica 15 pt,
”Mina bedömningar” 22 pt fetstil, matchrubriker 18 pt fetstil och underrubriker
i fetstil. Skriptet infogar bilden före första stycket; Mail sköter mejlets
MIME-format och teckenkodning.
Kommentarerna inleds med ”Mina bedömningar”. Layouten ska likna renderad
Markdown: tydliga rubriknivåer, kompakt rad för odds och insats, blankrader
och korta stycken. Inga synliga Markdown-tecken eller långa textrader som
avdelare. Risker visas som en punkt per mening utan att ändra ordalydelsen. Den rubriken ersätter
äldre ”Spelstatus” för mejlets kommentarer, även i CONTEXT.md. Motivera **samtliga aktiva spel** vid
varje ping, även utan nya val, i både mejlet och chattrapporten.
Använd ett tydligt numrerat avsnitt per match i samma ordning som affischen,
markera nya spel med `[NYTT]` och visa låst odds och insats.
Visa hela den sparade motiveringen (`rationale`) under ”Varför detta spel?”
och sparade risker (`risk`) under ”Risker”. Dela långa texter
i kortare stycken med blankrader. Behåll den ursprungliga bedömningen och skilj
ny verifierad information från skälen vid bokföringen; skriv inte om historiken.
Saknad eller tom motivering för ett aktivt spel stoppar utskicket före sändningsmarkeringen;
komplettera från det sparade analysunderlaget först. Detta ersätter äldre
instruktioner om motiveringar enbart för nya spel, även i CONTEXT.md.
Om bilden inte kan skapas
eller skickas, rapportera felet i chatten utan automatisk textnotifiering som reserv.
`--preview` visar bildtext och bilagans sökväg utan att skicka eller spara någon sändningsmarkering.
Läget utan `--attachment` finns kvar för uttryckliga förfrågningar utan affisch;
även då används formaterad text. Vid formatkontroll kan avsändarskriptet
anropas med `--draft` som sista argument efter bilagans sökväg. Det sparar ett
utkast utan att skicka; det är inte ett nytt ping och skapar ingen sändningsmarkering.

## Resultathistorik och efterhandskommentarer i projektet

Magnus tog bort historiksektionen från mejlet den 26 oktober 2026.
Mejlet ”ATP Speltips” ska bara innehålla affischen och kommentarer till
aktuella öppna spel. Skicka inte ”Resultathistorik sedan start” eller
historiska efterhandskommentarer. Detta ersätter äldre instruktioner om
historik i varje mejl, även i CONTEXT.md. Befintlig historik och kommentarer
behålls i projektet för separat uppföljning och analys; radera inga spel,
avräkningar eller efterhandskommentarer på grund av mejländringen.

Spara daterade efterhandskommentarer i `tracking/retrospectives.json`, knutna
till aktuell serie, spel-ID samt verifierad status och setresultat. Skriv
kommentarer för nya avgöranden vid varje ping. De får vara personliga och
resonerande, men skilj belagda matchfakta från tolkningar. Hitta inte på
skador, serveproblem, nyckelpoäng eller taktik utifrån enbart slutresultatet.
En knapp förlust bevisar inte spelvärde och en vinst bevisar inte rätt analys.
Vid korrigerat utfall måste efteranalysen granskas; skriptet visar inte en
gammal kommentar som avser annan status eller annat resultat. Saknas en
aktuell kommentar anges det öppet. Behåll ursprungliga förhandsmotiveringar
oförändrade; efteranalysen är separat. Tidigare skickade mejl ändras inte.

Mejlkvitton sparas inte. Endast `{"attempted": true}` under
`tracking/notifications/<ping>.json` behålls i `bets` för dubblettskydd.
Ingen mejltext, mottagarlista, bilagesökväg eller sändningsstatus sparas där.
Markeringen sätts atomärt före Apple Mail och spärrar omsändning även efter
avbrott eller osäkert utfall. Skriptet rapporterar det aktuella mejlförsökets
resultat i chatten; Apple Mails acceptans är inte verifierad leverans.
Rapportera misslyckad/osäker notifiering i chatten; gör inget automatiskt
omförsök och ändra inte redan bokförda spel på grund av notifieringsfel.
En ny ping-kontroll får en ny tidsstämpel och därmed en egen notifiering.

Notifieringen skickas när ett manuellt eller schemalagt ping hanteras,
även vid oförändrat läge. Testa formatet med `--preview` och mockade tester, inte genom
att skicka extra testnotifieringar.

Om ett nytt ping kommer efter fem minuter och inget har ändrats: skapa inga
nya spel eller dubbla avräkningar. Visa bara kort aktuell status för befintliga
matcher och totalsumman. Dra inte slutsatsen att en match har börjat eller
slutat enbart för att den planerade starttiden har passerat; markera okänd
status när den inte går att verifiera. Vid utebliven datakontakt, ange senaste
verifieringstid i stället för att presentera gammal status som aktuell.

## Dubblettkontroll

Kontrollera varje ny kandidat mot **hela** `bets.json`, inklusive alla datum
och redan avgjorda spel. En match längre fram än morgondagen är redan bokförd
när den tilldelats en spelplats och får inte väljas igen när matchdagen närmar sig.

Matchidentiteten är turneringsupplagans `event_id` tillsammans med båda
ATP-ID i sorterad ordning. Samma match ska stoppas även om spelarsidorna
bytt plats, den andra spelaren föreslås, oddset ändrats, matchen flyttats
eller oddsleverantören gett den ett nytt event-ID. Kontrollera också
dubbletter inom det nya kandidatpaketet. Statusvisning av ett befintligt
spel medför aldrig en ny insats. Nollställ inte historiken vid dygnsskifte.

## Bokföring

- `bets.json`: låsta rekommendationer med unika spel-ID, båda ATP-ID,
  turneringsupplaga, ursprunglig starttid, odds och insats. Ändra inte historiska
  val eller odds och registrera inte samma matchspel igen.
  Äldre `user_reported_actual_bet` får finnas kvar som historisk metadata,
  men ska ignoreras i all uppföljning och statistik. Rapportera bara
  pappersspelets ursprungliga odds och insats.
- `settlements.jsonl`: en avräkningshändelse per rad. Lägg till händelser;
  ersätt inte historiken. Senaste händelsen per spel gäller.
- `overview.md`: aktuell läsbar sammanställning som får uppdateras.

Sammanställningen ska innehålla **alla bokförda matcher**, även avslutade,
med vald spelare, motståndare, låst odds, insats, matchresultat, spelutfall
(vinst/förlust/void/öppet), utbetalning och netto i kronor. Avslutade matcher
ligger kvar i historiken när en spelplats fylls på. Öppna spel visas med
streck för utbetalning och netto, inte som nollresultat eller förlust.

## Historik för senare analys

Magnus vill kunna analysera alla spel i efterhand. Behåll varje bokfört spel
och dess ursprungliga tid, spelare, motståndare, turneringsupplaga, underlag,
låsta spelodds, TA-odds, insats, egen sannolikhetsbedömning och spelgräns,
motivering, risker och källor. Behåll tillhörande analysfiler och råunderlag.
Skriv inte om den ursprungliga bedömningen när resultatet blivit känt;
eventuell efteranalys ska vara separat och daterad.

Behåll resultat, utbetalning och netto för alla avslutade spel, inklusive
förluster och void. Alla resultatkorrigeringar ska vara spårbara i
`settlements.jsonl`. Vid en uttryckligt begärd nollställning ska den tidigare
serien arkiveras för analys och hållas skild från den nya seriens saldo.

Magnus förtydligade den 26 oktober 2026 att detta projekt enbart avser
simulering och en pappersportfölj. Ta inte hänsyn till faktiska spel och
redovisa inga separata faktiska insatser eller resultat i ping, mejl,
affischer, översikter eller statistiska analyser. Äldre faktiska uppgifter
behålls som historisk metadata men ska inte användas i beräkningarna.
Nya kontrollfiler ska inte innehålla `actual_open_stake_sek` eller
`actual_realized_net_sek`. Detta ersätter äldre instruktioner om faktisk
uppföljning, även i CONTEXT.md. Begränsa analysen till efterfrågad
pappersserie eller period och ange antalet avgjorda spel. Diff mot
TA visas som skillnad i implicerad sannolikhet, i procentenheter:
`100 * (1 / TA-odds - 1 / låst spelodds)`. TA:s befintliga 5 % marginal
behålls; diffen är inte förväntad avkastning.

## Avräkning och verifiering

Avräkningshändelser ska innehålla `bet_id`, `checked_at`, `status`,
`match_status`, `score`, `winner_id`, `source`, `source_match_id` samt
`payout_sek` och `net_sek` när spelet är avgjort. Ange en förklaring vid
korrigering eller oklar avräkning. Status är `pending`, `won`, `lost`, `void`
eller `review`. Skapa inte dubbla händelser vid oförändrat utfall.

Matcha resultat med båda ATP-ID och rätt turneringsupplaga; kontrollera omgång
om flera matchkopplingar är möjliga. Eventdatum i databasen är turneringens
startdatum. Matchens försvinnande från ett live- eller oddsflöde bevisar inte
att matchen är avgjord. Läs i första hand MariaDB via atp-tennis-skillens
`scripts/database.py`,
och kontrollera officiella ATP- eller arrangörskällor när importen ligger efter.
Resultatuppslag i sporttabellerna är endast läsning; bokföring sker genom betting_data till bets.

Använd inte `tennis.egelberg.se` för uppföljning eller schemaläggning.
Resultatkontroller görs direkt mot databasen eller officiell källa.

Vid normal färdigspelad match blir utbetalningen insats gånger låst odds vid
vinst, annars 0 kr. Netto är utbetalning minus insats. Använd `Decimal` och
avrunda penningbelopp till ören. Walkover, avbrott, diskvalifikation och andra
specialfall kräver kontrollerad tillämplig spelregel innan avräkning. Markera
oklara fall `review`. Bekräftad `void` återbetalar insatsen och ger netto 0 kr.
En pågående eller uppskjuten match förblir `pending`.

Summera utbetalningar och netto endast för avgjorda spel. Visa öppen insats
för `pending` och `review` separat. ROI är realiserat netto på `won`/`lost`
delat med deras insatser; `void` och öppna spel ingår inte i nämnaren.
Träffprocent är vinster delat med vinster plus förluster. Saknas avgjorda spel
är ROI och träffprocent ej beräkningsbara. Räkna om sammanställningen från hela
spelloggen och senaste avräkning, inte genom att addera gamla rapportsummor.

Det behövs ingen ständig livebevakning för resultatbokföringen: kontrollera
samtliga öppna spel vid nästa körning. Nya rekommendationer måste däremot
registreras före matchstart; skapa aldrig historiska tips i efterhand.

Den tidigare automationen ”Dagliga ATP-tips och spelresultat” kl. 07.00 togs
bort på Magnus begäran den 21 oktober 2026. Den aktuella körningen sker dagligen kl. 09.00 och återaktiverar inte 07.00-rutinen.
