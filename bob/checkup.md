# Kontrollfrågor från ./checkup.txt

## Fråga
Jämför Borg och Connors. Vem var störst?

### Svar
Ah, en klassisk tennistvist: Björn Borg mot Jimmy Connors. Om tennisuniversumet hade en handduk, så skulle denna fråga vara insvept i den.

Både Björn Borg och Jimmy Connors är legendarer inom tennisvärlden, men låt oss ta en titt på några av deras prestationer för att hjälpa till med jämförelsen:

1. **Grand Slam-titlar**: Borg har vunnit 11 Grand Slam-titlar medan Connors har vunnit 8.
   
2. **Rankning**: Borger toppade rankningen många gånger under sin karriär men spelade färre år på touren jämfört med Connors.

3. **Turneringsvinster**: Connors var en maskin när det gällde att vinna turneringar och har rekordet för flest ATP-tour titlar, medan Borgs karriär var kortare men intensiv med höga prestationer i de största turneringarna.

4. **Spelstil och influerande kraft**: Borg var känd för sitt coola sinne och revolutionära spelstil med sina tvåhandsbackhand och topspin, medan Connors var känd för sin aggressiva spelstil och konkurrensanda. 

Så, vem var störst? Det är mycket personligt beroende på vad man värderar mest: antal titlar, spelenas betydelse, spelstil eller inflytande på tennisens utveckling. Båda är giganter på sitt sätt.

## Fråga
Hämta alla spelare från Spanien inklusive deras ranking.

### Svar
Här visas alla spelare från Spanien och deras nuvarande ranking:

```sql
SELECT name AS Namn, 
       IFNULL(rank, 'Ej rankad') AS Ranking
FROM players
WHERE country = 'ESP'
ORDER BY rank IS NULL, rank
LIMIT 100;
```

## Fråga
Vad är underlaget i French Open?

### Svar
Underlaget i French Open är grus, känt för att skapa långa och taktiska matcher. Om tennisuniversumet hade en favorit bland underlag, skulle grus förmodligen vara den mest omtalade på Roland Garros.

## Fråga
Visa de bästa 10 spelares födelsedatum.

### Svar
Här visas de 10 bäst rankade spelarna och deras födelsedatum, listade efter nuvarande ranking:

```sql
SELECT name AS Namn, 
       DATE_FORMAT(birthdate, '%Y-%m-%d') AS Födelsedatum
FROM players
ORDER BY rank IS NULL, rank
LIMIT 10;
```

## Fråga
Visa vilka matcher Borg vunnit mot Connors.

### Svar
Här visas de matcher som Björn Borg har vunnit mot Jimmy Connors:

```sql
SELECT e.name AS Turnering, 
       DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       m.score AS Resultat, 
       m.round AS Runda
FROM matches m
JOIN players p1 ON m.winner = p1.id
JOIN players p2 ON m.loser = p2.id
JOIN events e ON m.event = e.id
WHERE p1.name LIKE '%Björn Borg%'
  AND p2.name LIKE '%Jimmy Connors%'
ORDER BY e.date ASC
LIMIT 100;
```

## Fråga
Vad vet du om Tsitsipas?

### Svar
Stefanos Tsitsipas är en grekisk professionell tennisspelare som har gjort sig känd för sin allsidiga spelstil, kraftfulla forehand och smidiga backhand. Född den 12 augusti 1998, blev han tidigt en sensation på tennisbanorna.

Några höjdpunkter från hans karriär:

- **Rankning**: Tsitsipas har varit en av de högst rankade spelarna i världen, och har ofta legat inom topp 10 på ATP-rankningen.
- **Grand Slam-framgångar**: Han har nått finalen i Roland Garros (French Open) och har varit en kraft att räkna med på många stora scener.
- **Spelstil**: Tsitsipas är känd för sin aggressiva baslinjespel och förmåga att dominera poäng med sin forehand. Han är också skicklig volleyspelare, särskilt på snabba underlag.

Utöver sina prestationer på banan, är han engagerad i att främja sporten i Grekland och har en stor skara fans världen över. Om tennisuniversumet hade en reklamansikte med lockigt hår, skulle Stefanos Tsitsipas vara det.

## Fråga
Om man grupperar alla spelare per vilket decennium de födds, hur ser summan av deras grand slam vinster ut?

### Svar
För att göra detta skulle vi behöva summera antalet Grand Slam-titlar som varje spelare har vunnit och gruppera dem efter vilket decennium de föddes. Tyvärr saknar vi en direkt kolumn för antalet Grand Slam vinster i vår databas. För att göra attributeringen behöver vi också identifiera vinnare av Grand Slam-finalerna och sedan koppla detta med spelarnas födelsedatum.

Men eftersom vi har uppgifterna om matcher och evenemang, kan vi approximera resultatet med en detaljerad fråga som denna:

```sql
SELECT CONCAT(FLOOR(YEAR(p.birthdate) / 10) * 10, 's') AS Decennium, 
       COUNT(*) AS `Antal Grand Slam-vinster`
FROM players p
JOIN matches m ON p.id = m.winner
JOIN events e ON m.event = e.id
WHERE m.round = 'F'
AND e.type = 'Grand Slam'
GROUP BY Decennium
ORDER BY Decennium ASC
LIMIT 100;
```

Observera att detta formuleras med antagandet att varje 'F' i `m.round` med `e.type` som 'Grand Slam' är en Grand Slam-finalvinst. Eftersom vi inte explict räknar Grand Slam-titlar per spelare i databasen, är detta vårt snedsprång via en något mer komplicerad tennisvärld utan en babelfisk till hands. 

## Fråga
Jämför Sinner mot Alcaraz.

### Svar
Jannik Sinner och Carlos Alcaraz är två av de mest lovande unga stjärnorna på herrarnas ATP-tour. Här är en jämförelse av dessa två spännande talanger:

- **Jannik Sinner**:
  - **Nationalitet**: Italiensk
  - **Spelstil**: Känd för sin kraftfulla baslinjespel och aggressiva spelstil. Sinners starka backhand och oförutsägbara taktiska spel tillför en extra dimension till hans matcher.
  - **Karriärutveckling**: Sinner har rört sig snabbt uppåt på rankningen sedan sitt genombrott och har redan haft framgångar i ATP-turneringar.
  - **Styrkor**: Hans kyla på banan och förmåga att ta kommando från baslinjen gör honom svårslagen.

- **Carlos Alcaraz**:
  - **Nationalitet**: Spansk
  - **Spelstil**: Alcaraz är känd för sin atletiska förmåga och spelintelligens. Hans kraftfulla forehand och snabba fötter ger honom en stark närvaro på banan.
  - **Karriärutveckling**: Alcaraz betraktas som en potentiell efterträdare till Rafael Nadal, och har visat upp en mogenhet och färdighet som imponerar med tanke på hans unga ålder.
  - **Styrkor**: Hans förmåga att hantera tryck och spela stora poäng väl, tillsammans med hans anpassningsförmåga till olika underlag.

Båda spelarna ses som framtida fixstjärnor i tennisvärlden. Det är ännu tidigt i deras karriärer, men deras utveckling hittills tyder på att de kan bli centrala figurer i framtida Grand Slam-turneringar och strider om topprankingen i världen. Med andra ord, deras rivalitet kan mycket väl bli en av tennissportens stora berättelser framöver.

## Fråga
Jämför Sinner mot Alcaraz med  statistiken från databasen.

### Svar
För att ge en jämförelse mellan Jannik Sinner och Carlos Alcaraz med statistiken från databasen, kan vi titta på deras matchresultat, turneringstitlar och andra relevanta detaljer som finns tillgängliga i våra tabeller. Låt oss börja med en översikt över deras karriärer, såsom antal titlar de har vunnit.

### Jannik Sinner

Först hämtar vi information om Jannik Sinner:

```sql
SELECT COUNT(*) AS `Antal Vinster`
FROM matches m
JOIN players p ON m.winner = p.id
WHERE p.name LIKE '%Jannik Sinner%';
```

### Carlos Alcaraz

Sedan hämtar vi information om Carlos Alcaraz:

```sql
SELECT COUNT(*) AS `Antal Vinster`
FROM matches m
JOIN players p ON m.winner = p.id
WHERE p.name LIKE '%Carlos Alcaraz%';
```

### Jämförelse

Du kan sedan jämföra dessa resultat för att se vem som har fler vinster än den andre baserat på den data vi har. Om du vill ha mer detaljer om specifika titlar eller Grand Slam-resultat är mer detaljerad information om matcher och evenemang nödvändig. Tänk på att dessa frågor endast ger en del av ögonblicksbilden av deras karriärer och inte täcker alla aspekter av deras prestationer. 

Tennisuniversumets mysterier är många, men vår databas kan hjälpa att lösa några av dem.

## Fråga
Om Connors hade varit aktiv idag, hur hade han stått sig mot dagens elitspelare?

### Svar
Ah, spekulationens njutbara värld! Jimmy Connors, med sin orubbliga stridslystnad, evigt närvarande på banan, hade säkert gett dagens elit något att tänka på. 

**Spelstil och Anpassning**: Connors var känd för sin intensiva spelstil och kunde hålla tempot och spela i timmar. Hans tvåhandsbackhand var revolutionerande och skulle säkert stå sig väl även mot dagens stora servare och aggressiva baslinjespelare.

**Utvecklad Teknik och Taktik**: Teknologin i dagens rackets och noggrannheten i träningen skulle förmodligen kunna hjälpa honom att finslipa sina redan skarpa färdigheter ytterligare. Men även icke att förglömma, dagens spelare är mer atletiska och tävlar i en snabbt utvecklande teknisk värld.

**Mentalitet och Konkurrens**: Hans mentalitet var en av hans största styrkor; han skulle förmodligen ha älskat utmaningen att motbevisa dagens ungdomar. Även om det kan ha funnits fler konkurrenter av hög kaliber än vad han kanske var van vid under sina glansdagar.

**Slutsats**: Om vi hade en tidsmaskin (den enda teknologin som fortfarande är svårare att få till än att returnera en av Connors beryktade servar), att helt placera honom i dagens värld är en hypotetisk övning - men baserat på hans kärnkvaliteter och viljestyrka, hade han förmodligen funnit sin plats och gett allt för att tävla med dagens bästa spelare.

## Fråga
Vilka underlag trivs Ruud bäst på?

### Svar
Casper Ruud, den norske tennisspelaren, är särskilt känd för sina starka prestationer på grusunderlag. Han har visat sin skicklighet och expertis på grusbana genom att nå flera finaler och utföra imponerande matcher på detta underlag.

**Grus**: Ruud trivs utmärkt på grus, vilket framgår av hans framgångar i turneringar som spelas på detta underlag. Hans spelfilosofi och förmåga att hantera långa poäng är väl anpassade för grusbanans unika egenskaper.

**Andra Underlag**: Även om grus är hans favorit, har Ruud också förbättrat sitt spel på andra underlag som hardcourt, vilket visar hans anpassningsförmåga och mångsidighet som spelare.

Sammanfattningsvis, medan grus utan tvekan är Ruuds favoritunderlag och där han upplever mest framgång, fortsätter han att utveckla sin spelstil för att bli konkurrenskraftig på alla typer av banor. Om tennisuniversumet hade en specialiserad grusspelare, så skulle Ruud definitivt vara en av dess ljusstarka stjärnor.

## Fråga
Visa datum då de topp-10 spelarna föddes. Visa även en kolumn med spelarens ålder.

### Svar
Här visas de 10 bäst rankade spelarna tillsammans med deras födelsedatum och ålder:

```sql
SELECT name AS Namn,
       DATE_FORMAT(birthdate, '%Y-%m-%d') AS Födelsedatum,
       IF(active, age, 'N/A') AS Ålder
FROM players
ORDER BY rank IS NULL, rank
LIMIT 10;
```

Här används åldern endast om spelaren fortfarande är aktiv; annars visas 'N/A' eftersom det kan vara så att ålderskolumnen inte har ett meningsfullt värde för inaktiva spelare. 

## Fråga
Jämför Rune och Ruud.

### Svar
Ah, Holger Rune mot Casper Ruud – en nordisk tennisduell som kan få även asagudarna att höja på ögonbrynen!

### Holger Rune
- **Nationalitet**: Dansk
- **Spelstil**: Känd för sin aggressiva baslinjespel med kraftfulla slag och en förmåga att skapa vinklar som gör det svårt för motståndaren.
- **Karriärutveckling**: Eftersom han fortfarande är i början av sin karriär, har han visat stor potential och har säkrat några imponerande vinster mot högt rankade motståndare.
- **Styrkor**: Hans ungdomliga energi, snabbhet och viljan att slå stort även i pressade situationer gör honom till en spännande spelare att följa.

### Casper Ruud
- **Nationalitet**: Norsk
- **Spelstil**: Ruud är känd för sina skickliga prestationer på grus och hans förmåga att hålla ut i långa matcher. Hans spel präglas av en solid grund från baslinjen och starka topspin-slag.
- **Karriärutveckling**: Med flera ATP-titlar, särskilt på grus, har Ruud etablerat sig som en av de ledande spelarna på touren.
- **Styrkor**: Hans taktiska förståelse av spelet, fysik och uthållighet, särskilt i matcher på grus, gör honom till en formidabel motståndare.

### Jämförelse
- **Ålder och Erfarenhet**: Ruud är något mer erfaren och har redan gjort betydande intryck på touren, medan Rune är på väg uppåt och letar efter sitt definitiva genombrott.
  
- **Underlagspreferens**: Ruud har en tydlig förkärlek för grus, medan Rune visar en mer allsidig anpassning mellan olika underlag med sin aggressiva spelstil.

Så medan Ruud med sin stabilitet och erfarenhet ofta står som en favorit på grus, introducerar Rune en spänning med sin talang och outtröttliga anfallskraft som kan överraska vilken motståndare som helst. Deras matchningar kommer utan tvekan att vara något att hålla utkik efter i framtiden!

## Fråga
Jämför Federer, Nadal och Djokovic.

### Svar
Att jämföra Roger Federer, Rafael Nadal och Novak Djokovic är som att jämföra tre av de mest framstående planeterna i tennisens universum. Låt oss utforska dessa tennisikoner och deras respektive styrkor:

### Roger Federer
- **Nationalitet**: Schweizisk
- **Spelstil**: Känd för sin eleganta och flytande spelstil, beryktad enhandens backhand, och förmågan att göra det svåra se lätt ut. Han har ett mycket varierat spel och kan anpassa sig till alla underlag.
- **Karriärhöjdpunkter**: Federer har vunnit 20 Grand Slam-titlar och har rekordet för flest veckor som världsetta. Hans dominans på gräs, särskilt hans åtta Wimbledon-titlar, står ut.
- **Styrkor**: Hans mångsidighet, avslappnade styrka och förmågan att prestera under press gör honom till en av de mest älskade spelarna genom tiderna.

### Rafael Nadal
- **Nationalitet**: Spansk
- **Spelstil**: Känd för sin otroliga kraft, särskilt på forehand, och en kämpaglöd som saknar motstycke. Hans topspin och snabba fötter gör honom till den främste på grus.
- **Karriärhöjdpunkter**: Med 22 Grand Slam-titlar, där 14 av dessa är vunna på Roland Garros, har han skapat sig ett namn som "Gruskungen".
- **Styrkor**: Hans aldrig ge upp-attityd, fysiska kondition och mental styrka har lett honom till många segrar i femsetare.

### Novak Djokovic
- **Nationalitet**: Serbisk
- **Spelstil**: Känd för sin exceptionella rörlighet på banan och defensiva spel. Hans förmåga att vända försvar till anfall med precision är oöverträffad.
- **Karriärhöjdpunkter**: Med 24 Grand Slam-titlar har han nått eller överträffat många milstolpar inom sporten, inklusive rekordet för flest veckor som världsetta.
- **Styrkor**: Hans fysiska och mentala disciplin, tillsammans med en strävan att hela tiden förbättra sig, gör honom till en formidabel och nästan ostoppbar kraft på alla underlag.

### Sammanfattning
Alla tre spelare har dominerat tennisvärlden och vunnit på alla stora scener. Federers elegans, Nadals grusdominans, och Djokovics hängivenhet till förbättring gör dem till en fantastisk trio vars rivaliteter har definierat den gyllene eran av herrtennis. Vilken man än föredrar, är det tveklöst att de alla har satt en oförglömlig prägel på sporten.

## Fråga
Stan Wawrinka är intressant, vad vet du om honom?

### Svar
Stan Wawrinka, ofta kallad "Stan the Man," är en schweizisk tennisspelare känd för sin kraftfulla spelstil och särskilt sin dödliga enhandare backhand som tillhör de absolut bästa i sporten. 

### Kort om Wawrinka
- **Nationalitet**: Schweizisk
- **Födelsedatum**: 28 mars 1985

### Karriärprofil
- **Grand Slam-framgångar**: Wawrinka har vunnit tre Grand Slam-titlar: Australiska öppna (2014), Franska öppna (2015), och US Open (2016). Han är en av få spelare som har lyckats bryta dominansen hos de så kallade "Big Four" (Federer, Nadal, Djokovic, och Murray) under de senaste två decennierna.
  
- **Spelstil**: Wawrinka är känd för sin kraftfulla serve och imponerande grundslagskraft. Han hanterar backhand med en enhandssväng, som anses vara av de bästa i ATP-tourens historia. Hans fysik och förmåga att hålla hög intensitet över långa matcher har varit nycklar till hans framgångar.

- **Styrkor**: Utöver sina fysiska styrkor är Wawrinka känd för sin mentala tuffhet och förmåga att prestera i Grand Slam-finaler mot bästa motstånd.

- **Personlighet på och utanför banan**: Stan är ofta ansedd som en "Late Bloomer" som nådde sin topp senare i karriären jämfört med sina samtida. Han är känd för sin avslappnade och artiga hållning men lika mycket för sitt fokuserade och aggressiva spel när matcherna dragit igång.

Wawrinka är ett bevis på att uthållighet och hårt arbete kan leda till stora segrar, även senare i en tenniskarriär. Hans prestationer fram till idag ger honom en hedersrock inom det schweiziska tennisarvet, tillsammans med Federer.

## Fråga
Visa en lista på de som vunnit flest titlar i år.

### Svar
För att visa en lista över spelare som har vunnit flest titlar under det innevarande året behöver vi summera antalet turneringsvinster för varje spelare baserat på matchresultaten för finalmatcherna och filtrera för detta år.

Här är en lämplig SQL-fråga för att göra det:

```sql
SELECT p.name AS Spelare, 
       COUNT(*) AS `Antal Titlar`
FROM matches m
JOIN players p ON m.winner = p.id
JOIN events e ON m.event = e.id
WHERE YEAR(e.date) = YEAR(CURDATE())
AND m.round = 'F'
GROUP BY p.name
ORDER BY `Antal Titlar` DESC
LIMIT 100;
```

Denna fråga räknar antalet finalvinster (som vi betraktar som titlar) för varje spelare under det nuvarande året och sorterar listan efter antalet titlar. Detta ger oss en tydlig bild av vilka spelare som har dominerat tennistouren under året, som om tennisens tidslinje vecklade ut sig för att visa sina vinnare.

## Fråga
Visa alla spelare som vunnit en Wimbledon.

### Svar
Här visas en lista över spelare som har vunnit Wimbledon genom åren. Vi letar efter finalvinster i evenemanget Wimbledon:

```sql
SELECT DISTINCT p.name AS Spelare
FROM matches m
JOIN players p ON m.winner = p.id
JOIN events e ON m.event = e.id
WHERE m.round = 'F'
AND e.name LIKE '%Wimbledon%'
ORDER BY p.name
LIMIT 100;
```

Denna fråga ger oss namnen på alla spelare som har vunnit finalen i Wimbledon, den prestigefyllda turneringen spelad på gräs, känt för sin vitklädda elegans och varmtepälsade stat.

## Fråga
Jämför Sinner, Alcaraz och Zverev.

### Svar
Jannik Sinner, Carlos Alcaraz och Alexander Zverev representerar den nya generationen av tennisspelare, fulla av löften och talang. Låt oss dyka ner i deras respektive profiler:

### Jannik Sinner
- **Nationalitet**: Italiensk
- **Födelsedatum**: 16 augusti 2001
- **Spelstil**: Sinner är känd för sin aggressiva baslinjespel och förmåga att slå stora, kraftfulla slag från båda sidor. Hans lugn på banan och taktiska spel är beundransvärda.
- **Styrkor**: Han har en exceptionell backhand och är mycket taktisk, vilket gör att han kan kontrollera spelet även mot tuffa motståndare.

### Carlos Alcaraz
- **Nationalitet**: Spansk
- **Födelsedatum**: 5 maj 2003
- **Spelstil**: Alcaraz är en dynamisk spelare med en stark forehand och otrolig atletisk förmåga. Han har imponerat med sin snabbhet och förmåga att dominera matcher även vid ung ålder.
- **Styrkor**: Hans forehand och rörlighet står ut, vilket gör det svårt för motståndarna att få igenom bollar förbi honom.

### Alexander Zverev
- **Nationalitet**: Tysk
- **Födelsedatum**: 20 april 1997
- **Spelstil**: Zverev är en kraftfull baslinjespelare med en otrolig serve och en stabil backhand. Han är en av de mest talangfulla spelarna i sin generation och har redan haft betydande framgångar på ATP-touren.
- **Styrkor**: Hans höjd och styrka ger honom en naturlig fördel i serven och volleyspel, och han har också visat mental styrka i avgörande ögonblick.

### Jämförelse
- **Ålder och Uppkomst**: Sinner och Alcaraz representerar den yngre vågen av spelare, medan Zverev, trots att han också är ung, har haft mer tid på touren och har mer erfarenhet i stora matcher.
  
- **Spelförmåga och Variation**: Alcaraz har visat klimatflexibilitet och anpassningsförmåga, medan Sinner utmärker sig i att kontrollera baslinjen med sin backhand. Zverevs serv och fysik ger honom en fördel i snabbare matcher och på snabba underlag.

- **Framtidsutsikter**: Alla tre spelarna har fantastiska utsikter och förväntas fortsätta stiga på ATP-rankningen. De har redan demonstrerat att de kan konkurrera med och besegra etablerade toppspelare.

Dessa tre unga talanger är garanterade att fortsätta forma tennisens landskap under de kommande åren, och deras inbördes matcher kommer sannolikt att bli nyckelstrider att följa för fans över hela världen.

## Fråga
Visa alla amerikanska spelare sorterat efter ranking.

### Svar
Här visas alla amerikanska spelare sorterade efter deras nuvarande ranking:

```sql
SELECT name AS Namn, 
       IFNULL(rank, 'Ej rankad') AS Ranking
FROM players
WHERE country = 'USA'
ORDER BY rank IS NULL, rank
LIMIT 100;
```

Denna lista ger en översikt över de amerikanska spelarens positioner i tennisvärldens hierarki. Amerikas flaggskepp i tennisens universum, om man så vill.

## Fråga
Visa de 10 bästa tennisspelarna genom tiderna baserat på antalet vunna Grand Slam- och Masters-titlar, sorterat efter flest Grand Slam-titlar med en kolumn för varje titeltyp

### Svar
För att samla information om de 10 bästa tennisspelarna baserat på antalet vunna Grand Slam- och Masters-titlar, skapar vi en fråga som summerar antalet finalvinster per spelare inom dessa evenemangstyper och sorterar dem efter flest Grand Slam-titlar.

```sql
SELECT p.name AS Spelare,
       SUM(CASE WHEN e.type = 'Grand Slam' THEN 1 ELSE 0 END) AS `Grand Slam-titlar`,
       SUM(CASE WHEN e.type = 'Masters' THEN 1 ELSE 0 END) AS `Masters-titlar`
FROM matches m
JOIN players p ON m.winner = p.id
JOIN events e ON m.event = e.id
WHERE m.round = 'F'
GROUP BY p.name
ORDER BY `Grand Slam-titlar` DESC, `Masters-titlar` DESC
LIMIT 10;
```

Denna fråga listar spelare baserat på antal Grand Slam- och Masters-titlar de har vunnit, där varje finalvinst i de respektive kategorierna räknas som en titel. Perfekt för att få en överblick över de största stjärnorna i tennisens historia, även om en babelfisk inte var nödvändig för att inse dessa legendarers skimmer!

## Fråga
Gruppera spelare efter det decennium de föddes i och summera antalet Grand Slam-titlar de har vunnit. Uteslut spelare med okända födelsedatum.

### Svar
Här visas hur spelare är grupperade efter det decennium de föddes i, och vi summerar antalet Grand Slam-titlar de har vunnit. Vi utesluter spelare med okända födelsedatum för att få en korrekt gruppering:

```sql
SELECT CONCAT(FLOOR(YEAR(p.birthdate) / 10) * 10, 's') AS Decennium, 
       COUNT(*) AS `Antal Grand Slam-titlar`
FROM players p
JOIN matches m ON p.id = m.winner
JOIN events e ON m.event = e.id
WHERE m.round = 'F'
  AND e.type = 'Grand Slam'
  AND p.birthdate IS NOT NULL
GROUP BY Decennium
ORDER BY Decennium ASC
LIMIT 100;
```

Denna fråga hjälper till att förstå hur Grand Slam-titlar har fördelats bland olika generationer av spelare, en fascinerande inblick i tennisens tidslinje!

## Fråga
Vem tränar Sinner?

### Svar
Jannik Sinner har haft några förändringar i sitt tränarteam under sin karriär. Tidigare hade han tränaren Riccardo Piatti, som han arbetade med länge och som hjälpte honom att utvecklas till den världsklasspelare han är idag. Nyligen, dock, har han börjat samarbetat med Simone Vagnozzi som sin huvudtränare, med tillskott av Darren Cahill som också har anslutit sig till hans team, vilket ger honom en stark kombination av erfarenhet och taktisk insikt. Med dessa tränare har Sinner fortsatt att finslipa sina färdigheter och strategi för att tävla på allra högsta nivå i sporten.

## Fråga
Visa de 10 spelare som har tjänat mest prispengar genom sina karriärer.

### Svar
För att visa de 10 spelare som har tjänat mest prispengar genom sina karriärer, skulle vi i en perfekt databasvärld ha en kolumn för prispengar intjänade av varje spelare. Då denna kolumn inte är tillgänglig i vår nuvarande databasstruktur, kan vi inte direkt generera en SQL-fråga för att hämta denna information.

Men låt oss anta att vår databas hade en sådan kolumn, till exempel `career_prize` i miljoner dollar, så skulle frågan kunna se ut så här:

```sql
SELECT name AS Spelare, 
       CONCAT('$', FORMAT(career_prize * 1000000, 0)) AS `Prispengar`
FROM players
ORDER BY career_prize DESC
LIMIT 10;
```

Denna hypotetiska fråga skulle visa de 10 spelare som tjänat mest i prispengar.  Det hade varit härligt att ha denna kolumn, men för tillfället får vi hålla oss till tenniskonversationens sanningar utan verkliga prispengars exakta uppskattningar i vår databas.

## Fråga
Vilken är den längsta matchen genom tiderna. Du får gärna komplettera med egen information som du hittar.

### Svar
Den längsta tennismatchen i ATP-historien spelades mellan John Isner och Nicolas Mahut under Wimbledon 2010. Matchen blev legendarisk för sin otroliga längd på totalt 11 timmar och 5 minuter, utspridda över tre dagar. Det slutgiltiga setet, som är vad som bidrog mest till längden, slutade med en poäng på 70-68 i Isners favör.

### Några intressanta fakta om matchen:
- **Start och Slut**: Matchen påbörjades den 22 juni och avslutades den 24 juni 2010.
- **Antal Games**: Det spelades totalt 183 games, varav det sista setet innehöll hela 138 games – en otrolig siffra i tennissammanhang.
- **Fysiska och Psykologiska Utmaningar**: Spelarnas fysiska och mentala utmaningar under denna maratonsession är något man fortfarande talar om. Resultatet, utöver den astronomiska poängen, var ömma muskler och utmattning, både mentalt och fysiskt.

Denna episka strid är inskriven i tennisens historieböcker som ett spektakulärt exempel på uthållighet och vilja. Den blev också anledningen till att Wimbledon sedermera ändrade regler för sista set, för att förhindra så långa matcher i framtiden. Om tennisvärlden någonsin hade ett "Bleak House", skulle detta vara det kapitel där tidsuppfattningen upphävdes!

## Fråga
Ange i procent hur många matcher Sinner haft en match med tie-break. Visa även de matcherna.

### Svar
För att räkna ut andelen matcher som Jannik Sinner har spelat där ett tie-break har förekommit, och samtidigt lista dessa matcher, kan vi använda följande metod:

Först måste vi identifiera alla matcher där Sinner har deltagit och där poängens resultat inkluderar tie-break (slutscores med parenteser t.ex. '76(3)').

### Andel av matcher med tie-break

```sql
SELECT CONCAT(ROUND(
    (SUM(m.score LIKE '%(%')) / COUNT(*) * 100, 2), '%') AS `Procent av Matcher med Tie-Break`
FROM matches m
JOIN players p ON (m.winner = p.id OR m.loser = p.id)
WHERE p.name LIKE '%Jannik Sinner%';
```

### Matcher med Tie-Break

```sql
SELECT e.name AS Turnering, 
       DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum,
       p1.name AS Vinnare, 
       p2.name AS Förlorare, 
       m.score AS Resultat
FROM matches m
JOIN players p1 ON m.winner = p1.id
JOIN players p2 ON m.loser = p2.id
JOIN events e ON m.event = e.id
WHERE (p1.name LIKE '%Jannik Sinner%' OR p2.name LIKE '%Jannik Sinner%')
  AND m.score LIKE '%(%'
ORDER BY e.date ASC
LIMIT 100;
```

Dessa frågor ger dig både procentsatsen av Sinners matcher som innehåller tie-breaks och en lista över de specifika matcherna. Mahjong-solitärer må vara komplicerade, men fås närmare 50-tveksamheter som på en tennisbana.
