# Kontrollfrågor från ./bob-checkup.txt

## Fråga
Jämför Borg och Connors. Vem var störst?

### Svar
Om vi pratar om Björn Borg och Jimmy Connors inom tennisuniversumet, så blev både Borg och Connors legendariska spelare. Borg var känd för sin fantastiska mentala styrka och framgång på både grus och gräs, medan Connors var känd för sin kämpaglöd och sin intensitet på banan. Båda har haft stor framgång, men deras karriärer tog olika vägar.

För att göra en direkt jämförelse mellan dem baserat på data i vår databas, kan jag ta reda på deras titlar och annan statistik. Låt mig göra det.

Här visas antalet titlar som Björn Borg vann hela sin karriär:

```sql
SELECT COUNT(*) AS `Antal Titlar` 
FROM matches 
JOIN players ON matches.winner = players.id 
WHERE players.name LIKE '%Björn Borg%' AND matches.round = 'F';
```

Här visas antalet titlar som Jimmy Connors vann hela sin karriär:

```sql
SELECT COUNT(*) AS `Antal Titlar` 
FROM matches 
JOIN players ON matches.winner = players.id 
WHERE players.name LIKE '%Jimmy Connors%' AND matches.round = 'F';
```

Dessa frågor ger oss en inblick i vem som vann flest titlar. Eftersom deras karriärer och spelstil var så olika, är det kanske mer rättvist att säga att de båda var giganter inom sina respektive områden.

## Fråga
Hämta alla spelare från Spanien inklusive deras ranking.

### Svar
Här visas alla spelare från Spanien tillsammans med deras aktuella ranking:

```sql
SELECT name AS `Namn`, rank AS `Ranking`
FROM players
WHERE country = 'ESP'
ORDER BY rank IS NULL, rank
LIMIT 100;
```

## Fråga
Vad är underlaget i French Open?

### Svar
French Open, även känt som Roland Garros, spelas på grus. Grusbanorna gör turneringen unik och utmanande, vilket ofta gynnar spelare med stark uthållighet och strategiskt spel.

## Fråga
Visa de bästa 10 spelares födelsedatum.

### Svar
Här visas födelsedatumen för de 10 bästa spelarna baserat på deras aktuella ranking:

```sql
SELECT name AS `Namn`, DATE_FORMAT(birthdate, '%Y-%m-%d') AS `Födelsedatum`
FROM players
ORDER BY rank IS NULL, rank
LIMIT 10;
```

## Fråga
Visa vilka matcher Borg vunnit mot Connors.

### Svar
Här visas alla matcher som Björn Borg har vunnit mot Jimmy Connors:

```sql
SELECT m.id AS `Match ID`, 
       DATE_FORMAT(e.date, '%Y-%m-%d') AS `Datum`, 
       e.name AS `Turnering`, 
       e.location AS `Plats`, 
       m.score AS `Resultat`
FROM matches m
JOIN players p_winner ON m.winner = p_winner.id
JOIN players p_loser ON m.loser = p_loser.id
JOIN events e ON m.event = e.id
WHERE p_winner.name LIKE '%Björn Borg%'
  AND p_loser.name LIKE '%Jimmy Connors%'
LIMIT 100;
```

## Fråga
Vad vet du om Tsitsipas?

### Svar
Stefanos Tsitsipas är en framstående professionell tennisspelare från Grekland känd för sin imponerande spelstil och atletiska färdigheter på banan. Han blev snabbt ett namn att räkna med på ATP-touren efter sin professionella debut. 

Tsitsipas har en stark allround-spelstil, med en kraftfull serve, skicklighet vid nätet och en förmåga att spela både offensivt och defensivt. En av hans mest anmärkningsvärda prestationer var hans framfart i Grand Slam-turneringarna, där han nått flera djuplöpningar.

För mer exakt information baserat på vår databas, låt mig visa lite statistik om Stefanos Tsitsipas:

```sql
SELECT name AS `Namn`, 
       country AS `Land`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`, 
       pro AS `Proffs Sedan`, 
       active AS `Aktiv`
FROM players
WHERE name LIKE '%Stefanos Tsitsipas%'
LIMIT 1;
```

## Fråga
Om man grupperar alla spelare per vilket decennium de födds, hur ser summan av deras grand slam vinster ut?

### Svar
För att se hur många Grand Slam-titlar spelare har vunnit, grupperade efter det årtionde de föddes, kan vi använda följande fråga. Den här frågan visar en sammanställning av Grand Slam-titlar per årtionde:

```sql
SELECT CONCAT((YEAR(birthdate) DIV 10) * 10, '-talet') AS `Födelseårtionde`, 
       COUNT(*) AS `Grand Slam Titlar`
FROM players
JOIN matches ON players.id = matches.winner
JOIN events ON matches.event = events.id
WHERE matches.round = 'F' 
  AND events.type = 'Grand Slam'
GROUP BY `Födelseårtionde`
ORDER BY `Födelseårtionde`
LIMIT 100;
```

## Fråga
Jämför Sinner mot Alcaraz.

### Svar
För att jämföra två stigande stjärnor som Jannik Sinner och Carlos Alcaraz i tennisvärlden, kan vi titta på några statistiska parametrar från vår databas. Här är några relevanta frågor för att jämföra deras prestationer:

Först deras nuvarande ranking och högsta ranking:

Här visas Jannik Sinners aktuella och högsta ranking:

```sql
SELECT name AS `Namn`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`
FROM players
WHERE name LIKE '%Jannik Sinner%'
LIMIT 1;
```

Här visas Carlos Alcaraz's aktuella och högsta ranking:

```sql
SELECT name AS `Namn`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`
FROM players
WHERE name LIKE '%Carlos Alcaraz%'
LIMIT 1;
```

Därefter antalet titlar de vunnit:

Här visas antalet titlar Jannik Sinner har vunnit:

```sql
SELECT COUNT(*) AS `Antal Titlar` 
FROM matches 
JOIN players ON matches.winner = players.id 
WHERE players.name LIKE '%Jannik Sinner%' AND matches.round = 'F';
```

Här visas antalet titlar Carlos Alcaraz har vunnit:

```sql
SELECT COUNT(*) AS `Antal Titlar` 
FROM matches 
JOIN players ON matches.winner = players.id 
WHERE players.name LIKE '%Carlos Alcaraz%' AND matches.round = 'F';
```

Dessa frågor ger en inblick i deras nuvarande ranking, högsta ranking och antalet titlar de vunnit. Det är en bra utgångspunkt för att jämföra deras prestationer.

## Fråga
Jämför Sinner mot Alcaraz med  statistiken från databasen.

### Svar
Här är en jämförelse mellan Jannik Sinner och Carlos Alcaraz baserat på statistiken från databasen.

Först, Jannik Sinners statistik:

```sql
SELECT name AS `Namn`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`, 
       COUNT(matches.id) AS `Antal Titlar`
FROM players
LEFT JOIN matches ON players.id = matches.winner AND matches.round = 'F'
WHERE players.name LIKE '%Jannik Sinner%'
GROUP BY players.id
LIMIT 1;
```

Nu, Carlos Alcaraz's statistik:

```sql
SELECT name AS `Namn`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`, 
       COUNT(matches.id) AS `Antal Titlar`
FROM players
LEFT JOIN matches ON players.id = matches.winner AND matches.round = 'F'
WHERE players.name LIKE '%Carlos Alcaraz%'
GROUP BY players.id
LIMIT 1;
```

Dessa frågor ger oss en översikt av deras nuvarande ranking, högsta ranking de har haft, datum för deras högsta ranking och det totala antalet titlar i deras karriär.

## Fråga
Om Connors hade varit aktiv idag, hur hade han stått sig mot dagens elitspelare?

### Svar
Att spekulera i sådana hypotetiska scenarier är alltid intressant, särskilt när det gäller en spelare som Jimmy Connors. Han var känd för sin oförtröttliga energi, sin kämpaglöd och sin anpassningsförmåga på banan. Connors var en mästare i sin tid och skulle förmodligen kunna stå sig väl mot dagens spelare, åtminstone på vissa områden.

Dagens elitspelare är dock en annan typ av atlet, med förbättrad teknik, fysiska krav och utrustning. Om Connors hade haft tillgång till dagens resurser, såsom modern träning, diet, och teknologi, är det rimligt att anta att han skulle kunnat anpassa sitt spel för att konkurrera på högsta nivå. Men tennis har ändrats mycket sen hans tid, därmed skulle hans stil förmodligen behöva vissa justeringar för att passa dagens spel.

Naturligtvis är det omöjligt att säga exakt hur han skulle ha klarat sig eftersom så många variabler är inblandade, men med tanke på hans historia och anpassningsförmåga är det troligt att han skulle ha varit en formidabel motståndare. Om tennisuniversumet hade en handduk, så skulle denna fråga definitivt vara insvept i den.

## Fråga
Vilka underlag trivs Ruud bäst på?

### Svar
Casper Ruud, den framstående norska tennisspelaren, har gjort sig känd för att vara särskilt skicklig på grusunderlag. Han har haft stor framgång i turneringar som spelas på det underlaget, och hans rörelser på banan samt förmågan att generera topspin gör honom extra stark här. Med den övergripande bilden av hans karriär hittills, inklusive hans framgångar i grusturneringar, verkar det som att grus är hans mest föredragna underlag.

För att få en mer statistisk bild av detta från databasen, kan vi titta på antalet matcher han vunnit på olika underlag.

```sql
SELECT e.surface AS `Underlag`, COUNT(*) AS `Antal Vinster`
FROM matches m
JOIN players p ON m.winner = p.id
JOIN events e ON m.event = e.id
WHERE p.name LIKE '%Casper Ruud%'
GROUP BY e.surface
ORDER BY `Antal Vinster` DESC
LIMIT 100;
```

Den här frågan skulle kunna visa på vilket underlag Ruud har vunnit flest matcher, och därmed ge en tydlig fingervisning om hans mest framgångsrika underlag.

## Fråga
Visa datum då de topp-10 spelarna föddes. Visa även en kolumn med spelarens ålder.

### Svar
Här visas födelsedatumet och åldern för de 10 högst rankade spelarna:

```sql
SELECT name AS `Namn`, 
       DATE_FORMAT(birthdate, '%Y-%m-%d') AS `Födelsedatum`, 
       age AS `Ålder`
FROM players
WHERE rank IS NOT NULL
ORDER BY rank
LIMIT 10;
```

Denna fråga visar topp-10 spelarnas födelsedatum samt deras ålder, vilket ger en inblick i vilka som är de yngsta och äldsta bland de bästa.

## Fråga
Jämför Rune och Ruud.

### Svar
För att jämföra Holger Rune och Casper Ruud baserat på den statistik som är tillgänglig i databasen, visar jag här deras aktuella ranking, deras högsta ranking, och totalt antal titlar de vunnit.

Först Holger Runes statistik:

```sql
SELECT name AS `Namn`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`, 
       COUNT(matches.id) AS `Antal Titlar`
FROM players
LEFT JOIN matches ON players.id = matches.winner AND matches.round = 'F'
WHERE players.name LIKE '%Holger Rune%'
GROUP BY players.id
LIMIT 1;
```

Nu Casper Ruuds statistik:

```sql
SELECT name AS `Namn`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`, 
       COUNT(matches.id) AS `Antal Titlar`
FROM players
LEFT JOIN matches ON players.id = matches.winner AND matches.round = 'F'
WHERE players.name LIKE '%Casper Ruud%'
GROUP BY players.id
LIMIT 1;
```

Dessa frågor ger en översiktlig jämförelse av deras nuvarande ranking, högsta ranking de har haft, datum för deras högsta ranking och antalet titlar i deras karriär.

## Fråga
Jämför Federer, Nadal och Djokovic.

### Svar
För att jämföra dessa tre legendariska spelare, Roger Federer, Rafael Nadal och Novak Djokovic, kan vi undersöka deras nuvarande ranking, högsta ranking i karriären, och antalet vunna titlar.

Först Roger Federers statistik:

```sql
SELECT name AS `Namn`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`, 
       COUNT(matches.id) AS `Antal Titlar`
FROM players
LEFT JOIN matches ON players.id = matches.winner AND matches.round = 'F'
WHERE players.name LIKE '%Roger Federer%'
GROUP BY players.id
LIMIT 1;
```

Rafael Nadals statistik:

```sql
SELECT name AS `Namn`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`, 
       COUNT(matches.id) AS `Antal Titlar`
FROM players
LEFT JOIN matches ON players.id = matches.winner AND matches.round = 'F'
WHERE players.name LIKE '%Rafael Nadal%'
GROUP BY players.id
LIMIT 1;
```

Och slutligen Novak Djokovic's statistik:

```sql
SELECT name AS `Namn`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`, 
       COUNT(matches.id) AS `Antal Titlar`
FROM players
LEFT JOIN matches ON players.id = matches.winner AND matches.round = 'F'
WHERE players.name LIKE '%Novak Djokovic%'
GROUP BY players.id
LIMIT 1;
```

Dessa frågor ger en inblick i Federr, Nadal och Djokovic's ranking, högsta ranking och antalet titlar de vunnit, vilket ger oss en tydlig statistisk grund för att jämföra deras karriärer.

## Fråga
Stan Wawrinka är intressant, vad vet du om honom?

### Svar
Stan Wawrinka, även känd som "Stan the Man", är en schweizisk tennisspelare känd för sitt kraftfulla spel och speciellt sin backhand-slice, som betraktas som en av de bästa i sin generation. Han har haft en framgångsrik karriär med flera Grand Slam-titlar under sitt bälte, inklusive vinster i Australian Open, French Open och US Open.

Wawrinka är känd för sin förmåga att höja sitt spel i de stora turneringarna och trots att han ibland stått i skuggan av sina mer berömda landsmän som Roger Federer, har han etablerat sig som en av de mest framstående spelarna i modern tid.

För att ge en mer exakt bild av hans statistik från vår databas, här är några detaljer om Stan Wawrinka:

```sql
SELECT name AS `Namn`, 
       country AS `Land`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`, 
       pro AS `Proffs Sedan`, 
       active AS `Aktiv`
FROM players
WHERE name LIKE '%Stan Wawrinka%'
LIMIT 1;
```

Den här frågan ger en översikt över hans ranking, vilken nation han representerar, när han blev professionell och om han fortfarande är aktiv. Wawrinka är älskad för sitt intensiva spel och sin förmåga att prestera under press, vilket gjort honom till en publikfavorit.

## Fråga
Visa en lista på de som vunnit flest titlar i år.

### Svar
Här visas de spelare som har vunnit flest titlar under det aktuella året tillsammans med antalet titlar de vunnit:

```sql
SELECT players.name AS `Namn`, COUNT(matches.id) AS `Antal Titlar`
FROM matches
JOIN players ON matches.winner = players.id
JOIN events ON matches.event = events.id
WHERE matches.round = 'F' 
  AND YEAR(events.date) = YEAR(CURDATE())
GROUP BY players.name
ORDER BY `Antal Titlar` DESC
LIMIT 100;
```

## Fråga
Visa alla spelare som vunnit en Wimbledon.

### Svar
Här visas alla spelare som har vunnit en Wimbledon-titel:

```sql
SELECT DISTINCT players.name AS `Namn`
FROM matches
JOIN players ON matches.winner = players.id
JOIN events ON matches.event = events.id
WHERE matches.round = 'F'
  AND events.name LIKE '%Wimbledon%'
LIMIT 100;
```

## Fråga
Jämför Sinner, Alcaraz och Zverev.

### Svar
För att jämföra Jannik Sinner, Carlos Alcaraz och Alexander Zverev, kan vi titta på deras aktuella ranking, högsta ranking i karriären, och antalet vunna titlar. Här följer deras statistik:

Först Jannik Sinners statistik:

```sql
SELECT name AS `Namn`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`, 
       COUNT(matches.id) AS `Antal Titlar`
FROM players
LEFT JOIN matches ON players.id = matches.winner AND matches.round = 'F'
WHERE players.name LIKE '%Jannik Sinner%'
GROUP BY players.id
LIMIT 1;
```

Carlos Alcaraz's statistik:

```sql
SELECT name AS `Namn`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`, 
       COUNT(matches.id) AS `Antal Titlar`
FROM players
LEFT JOIN matches ON players.id = matches.winner AND matches.round = 'F'
WHERE players.name LIKE '%Carlos Alcaraz%'
GROUP BY players.id
LIMIT 1;
```

Och Alexander Zverevs statistik:

```sql
SELECT name AS `Namn`, 
       rank AS `Aktuell Ranking`, 
       highest_rank AS `Högsta Ranking`, 
       DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum För Högsta Ranking`, 
       COUNT(matches.id) AS `Antal Titlar`
FROM players
LEFT JOIN matches ON players.id = matches.winner AND matches.round = 'F'
WHERE players.name LIKE '%Alexander Zverev%'
GROUP BY players.id
LIMIT 1;
```

Dessa frågor ger en översikt av deras nuvarande ranking, högsta ranking de har haft, datum för deras högsta ranking och antalet titlar i deras karriär, vilket är en användbar jämförelse mellan dessa tre unga spelare.
