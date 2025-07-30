# Kontrollfrågor från ./checkup.txt

## Fråga
Felsökning på!

### Svar
Felsökningsläge är nu aktiverat. Ställ din fråga, så kommer jag att inkludera en detaljerad SQL-fråga efter JSON-blocket.

## Fråga
Jämför Borg och Connors. Vem var störst?

### Svar
Här kommer en analys av Björn Borg och Jimmy Connors. Vi börjar med persondata och fortsätter med deras vinster och förluster.

### Björn Borg

1. **Persondata:**

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Björn Borg%' LIMIT 100",
  "comment": "Visar persondata för Björn Borg såsom namn, land, ålder, aktuell ranking och bästa ranking."
}
```

```sql
SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Björn Borg%' LIMIT 100;
```

2. **Titlar Grupperade per Typ:**

```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Björn Borg%' AND m.round = 'F' GROUP BY e.type LIMIT 100",
  "comment": "Visar alla turneringar Björn Borg vunnit, grupperat efter typ av turnering."
}
```

```sql
SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Björn Borg%' AND m.round = 'F' GROUP BY e.type LIMIT 100;
```

3. **Vinster mot Topp-20 senaste året:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Björn Borg%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) LIMIT 100",
  "comment": "Visar vilka topp-20 spelare Björn Borg vunnit mot under senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Björn Borg%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) LIMIT 100;
```

4. **Vinster senaste tre månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Björn Borg%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100",
  "comment": "Visar vilka matcher Björn Borg vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Björn Borg%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100;
```

5. **Förluster senaste tre månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Björn Borg%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100",
  "comment": "Visar vilka matcher Björn Borg förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Björn Borg%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100;
```

### Jimmy Connors

1. **Persondata:**

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Jimmy Connors%' LIMIT 100",
  "comment": "Visar persondata för Jimmy Connors såsom namn, land, ålder, aktuell ranking och bästa ranking."
}
```

```sql
SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Jimmy Connors%' LIMIT 100;
```

2. **Titlar Grupperade per Typ:**

```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Jimmy Connors%' AND m.round = 'F' GROUP BY e.type LIMIT 100",
  "comment": "Visar alla turneringar Jimmy Connors vunnit, grupperat efter typ av turnering."
}
```

```sql
SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Jimmy Connors%' AND m.round = 'F' GROUP BY e.type LIMIT 100;
```

3. **Vinster mot Topp-20 senaste året:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Jimmy Connors%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) LIMIT 100",
  "comment": "Visar vilka topp-20 spelare Jimmy Connors vunnit mot under senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Jimmy Connors%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) LIMIT 100;
```

4. **Vinster senaste tre månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Jimmy Connors%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100",
  "comment": "Visar vilka matcher Jimmy Connors vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Jimmy Connors%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100;
```

5. **Förluster senaste tre månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Jimmy Connors%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100",
  "comment": "Visar vilka matcher Jimmy Connors förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Jimmy Connors%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100;
```

### Inbördes Möten

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Vinnare, p2.name AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE (p1.name LIKE '%Björn Borg%' AND p2.name LIKE '%Jimmy Connors%') OR (p1.name LIKE '%Jimmy Connors%' AND p2.name LIKE '%Björn Borg%') LIMIT 100",
  "comment": "Visar alla inbördes möten mellan Björn Borg och Jimmy Connors."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Vinnare, p2.name AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE (p1.name LIKE '%Björn Borg%' AND p2.name LIKE '%Jimmy Connors%') OR (p1.name LIKE '%Jimmy Connors%' AND p2.name LIKE '%Björn Borg%') LIMIT 100;
```

Det är dags att avgöra vem som var störst! Denna omfattande analys bör ge en tydligare bild av deras relativa positioner i tennisvärlden. Om tennisuniversumet hade en handduk, skulle dessa spelare vara insvepta i den med stor ära.

## Fråga
Hämta alla spelare från Spanien inklusive deras ranking.

### Svar
Här visas en lista över alla spelare från Spanien tillsammans med deras aktuella ranking.

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, IF(active, rank, 'N/A') AS Rank FROM players WHERE country = 'ESP' ORDER BY Rank IS NULL, Rank LIMIT 100",
  "comment": "Visar alla spelare från Spanien och deras aktuella ranking, sorterat så att rankade visas först."
}
```

```sql
SELECT name AS Namn, IF(active, rank, 'N/A') AS Rank FROM players WHERE country = 'ESP' ORDER BY Rank IS NULL, Rank LIMIT 100;
```

## Fråga
Vad är underlaget i French Open?

### Svar
French Open, även känt som Roland Garros, spelas på grusunderlag. Om tennisuniversumet var ett brädspel skulle det här underlaget vara dess tärning – avgörande och unikt.

## Fråga
Visa de bästa 10 spelares födelsedatum.

### Svar
Här är födelsedatum för de tio bäst rankade spelarna.

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, DATE_FORMAT(birthdate, '%Y-%m-%d') AS Födelsedatum FROM players WHERE rank IS NOT NULL ORDER BY rank LIMIT 10",
  "comment": "Visar födelsedatum för de 10 bäst rankade spelarna."
}
```

```sql
SELECT name AS Namn, DATE_FORMAT(birthdate, '%Y-%m-%d') AS Födelsedatum FROM players WHERE rank IS NOT NULL ORDER BY rank LIMIT 10;
```

## Fråga
Visa vilka matcher Borg vunnit mot Connors.

### Svar
Här är en lista över matcher där Björn Borg har vunnit mot Jimmy Connors.

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Björn Borg%' AND p2.name LIKE '%Jimmy Connors%' LIMIT 100",
  "comment": "Visar matcher där Björn Borg har vunnit mot Jimmy Connors."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Björn Borg%' AND p2.name LIKE '%Jimmy Connors%' LIMIT 100;
```

## Fråga
Vad vet du om Tsitsipas?

### Svar
Här är en analys av Stefanos Tsitsipas baserad på informationen i databasen:

1. **Persondata:**

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Stefanos Tsitsipas%' LIMIT 100",
  "comment": "Visar persondata för Stefanos Tsitsipas som namn, land, ålder, aktuell ranking och bästa ranking."
}
```

```sql
SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Stefanos Tsitsipas%' LIMIT 100;
```

2. **Titlar Grupperade per Typ:**

```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Stefanos Tsitsipas%' AND m.round = 'F' GROUP BY e.type LIMIT 100",
  "comment": "Visar alla turneringar Stefanos Tsitsipas har vunnit, grupperat efter typ av turnering."
}
```

```sql
SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Stefanos Tsitsipas%' AND m.round = 'F' GROUP BY e.type LIMIT 100;
```

3. **Vinster mot Topp-20 Spelare Senaste Året:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Stefanos Tsitsipas%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) LIMIT 100",
  "comment": "Visar vilka topp-20 spelare Stefanos Tsitsipas har vunnit mot under det senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Stefanos Tsitsipas%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) LIMIT 100;
```

4. **Vinster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Stefanos Tsitsipas%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100",
  "comment": "Visar vilka matcher Stefanos Tsitsipas har vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Stefanos Tsitsipas%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100;
```

5. **Förluster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Stefanos Tsitsipas%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100",
  "comment": "Visar vilka matcher Stefanos Tsitsipas har förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Stefanos Tsitsipas%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100;
```

Kanske ansåg tennisuniversumet Tsitsipas som ett resultat av elegant kadens och makalös smidighet.

## Fråga
Om man grupperar alla spelare per vilket decennium de födds, hur ser summan av deras grand slam vinster ut?

### Svar
Här är en sammanställning av Grand Slam-vinster grupperade efter vilket decennium spelarna föddes.

```json
{
  "content-type": "Query",
  "query": "SELECT CONCAT(FLOOR(YEAR(p.birthdate)/10)*10, 's') AS `Decennium`, COUNT(m.id) AS `Antal Grand Slam Vinster` FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE e.type = 'Grand Slam' AND m.round = 'F' GROUP BY `Decennium` ORDER BY `Decennium` LIMIT 100",
  "comment": "Visar antalet Grand Slam-vinster grupperade efter vilket decennium spelarna föddes."
}
```

```sql
SELECT CONCAT(FLOOR(YEAR(p.birthdate)/10)*10, 's') AS `Decennium`, COUNT(m.id) AS `Antal Grand Slam Vinster` FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE e.type = 'Grand Slam' AND m.round = 'F' GROUP BY `Decennium` ORDER BY `Decennium` LIMIT 100;
```

Här har vi dekrypterat tennishistorien per decennium, som om varje decennium var en skiva i en vinylsamling – var och en med en unik melodi av triumf.

## Fråga
Jämför Sinner mot Alcaraz.

### Svar
Här kommer en analys av Jannik Sinner och Carlos Alcaraz. Vi jämför deras persondata, titlar, vinster och förluster.

### Jannik Sinner

1. **Persondata:**

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Jannik Sinner%' LIMIT 100",
  "comment": "Visar persondata för Jannik Sinner som namn, land, ålder, aktuell ranking och bästa ranking."
}
```

```sql
SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Jannik Sinner%' LIMIT 100;
```

2. **Titlar Grupperade per Typ:**

```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Jannik Sinner%' AND m.round = 'F' GROUP BY e.type LIMIT 100",
  "comment": "Visar alla turneringar Jannik Sinner har vunnit, grupperat efter typ av turnering."
}
```

```sql
SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Jannik Sinner%' AND m.round = 'F' GROUP BY e.type LIMIT 100;
```

3. **Vinster mot Topp-20 Spelare Senaste Året:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Jannik Sinner%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) LIMIT 100",
  "comment": "Visar vilka topp-20 spelare Jannik Sinner har vunnit mot under det senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Jannik Sinner%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) LIMIT 100;
```

4. **Vinster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Jannik Sinner%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100",
  "comment": "Visar vilka matcher Jannik Sinner har vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Jannik Sinner%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100;
```

5. **Förluster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Jannik Sinner%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100",
  "comment": "Visar vilka matcher Jannik Sinner har förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Jannik Sinner%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100;
```

### Carlos Alcaraz

1. **Persondata:**

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Carlos Alcaraz%' LIMIT 100",
  "comment": "Visar persondata för Carlos Alcaraz som namn, land, ålder, aktuell ranking och bästa ranking."
}
```

```sql
SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Carlos Alcaraz%' LIMIT 100;
```

2. **Titlar Grupperade per Typ:**

```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Carlos Alcaraz%' AND m.round = 'F' GROUP BY e.type LIMIT 100",
  "comment": "Visar alla turneringar Carlos Alcaraz har vunnit, grupperat efter typ av turnering."
}
```

```sql
SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Carlos Alcaraz%' AND m.round = 'F' GROUP BY e.type LIMIT 100;
```

3. **Vinster mot Topp-20 Spelare Senaste Året:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Carlos Alcaraz%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) LIMIT 100",
  "comment": "Visar vilka topp-20 spelare Carlos Alcaraz har vunnit mot under det senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Carlos Alcaraz%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) LIMIT 100;
```

4. **Vinster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Carlos Alcaraz%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100",
  "comment": "Visar vilka matcher Carlos Alcaraz har vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Carlos Alcaraz%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100;
```

5. **Förluster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Carlos Alcaraz%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100",
  "comment": "Visar vilka matcher Carlos Alcaraz har förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Carlos Alcaraz%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) LIMIT 100;
```

### Inbördes Möten

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Vinnare, p2.name AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE (p1.name LIKE '%Jannik Sinner%' AND p2.name LIKE '%Carlos Alcaraz%') OR (p1.name LIKE '%Carlos Alcaraz%' AND p2.name LIKE '%Jannik Sinner%') LIMIT 100",
  "comment": "Visar alla inbördes möten mellan Jannik Sinner och Carlos Alcaraz."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Vinnare, p2.name AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE (p1.name LIKE '%Jannik Sinner%' AND p2.name LIKE '%Carlos Alcaraz%') OR (p1.name LIKE '%Carlos Alcaraz%' AND p2.name LIKE '%Jannik Sinner%') LIMIT 100;
```

Här har vi utfört en jämförande analys av dessa två framstående talanger i tennisuniversumet. Om de var planeter i ett solsystem, skulle deras banor definitivt korsas – kanske med en smash eller två.

## Fråga
Jämför Sinner mot Alcaraz med  statistiken från databasen.

### Svar
Här är en detaljerad jämförelse av Jannik Sinner och Carlos Alcaraz baserat på statistiken från databasen:

### Jannik Sinner

1. **Persondata:**

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Jannik Sinner%' LIMIT 100",
  "comment": "Visar persondata för Jannik Sinner som namn, land, ålder, aktuell ranking och bästa ranking."
}
```

```sql
SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Jannik Sinner%' LIMIT 100;
```

2. **Titlar Grupperade per Typ:**

```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Jannik Sinner%' AND m.round = 'F' GROUP BY e.type LIMIT 100",
  "comment": "Visar alla turneringar Jannik Sinner har vunnit, grupperat efter typ av turnering."
}
```

```sql
SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Jannik Sinner%' AND m.round = 'F' GROUP BY e.type LIMIT 100;
```

3. **Vinster mot Topp-20 Spelare Senaste Året:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Jannik Sinner%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka topp-20 spelare Jannik Sinner har vunnit mot under det senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Jannik Sinner%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC LIMIT 100;
```

4. **Vinster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Jannik Sinner%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka matcher Jannik Sinner har vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Jannik Sinner%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100;
```

5. **Förluster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Jannik Sinner%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka matcher Jannik Sinner har förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Jannik Sinner%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100;
```

### Carlos Alcaraz

1. **Persondata:**

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Carlos Alcaraz%' LIMIT 100",
  "comment": "Visar persondata för Carlos Alcaraz som namn, land, ålder, aktuell ranking och bästa ranking."
}
```

```sql
SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Carlos Alcaraz%' LIMIT 100;
```

2. **Titlar Grupperade per Typ:**

```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Carlos Alcaraz%' AND m.round = 'F' GROUP BY e.type LIMIT 100",
  "comment": "Visar alla turneringar Carlos Alcaraz har vunnit, grupperat efter typ av turnering."
}
```

```sql
SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Carlos Alcaraz%' AND m.round = 'F' GROUP BY e.type LIMIT 100;
```

3. **Vinster mot Topp-20 Spelare Senaste Året:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Carlos Alcaraz%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka topp-20 spelare Carlos Alcaraz har vunnit mot under det senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Carlos Alcaraz%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC LIMIT 100;
```

4. **Vinster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Carlos Alcaraz%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka matcher Carlos Alcaraz har vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Carlos Alcaraz%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100;
```

5. **Förluster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Carlos Alcaraz%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka matcher Carlos Alcaraz har förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Carlos Alcaraz%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100;
```

### Inbördes Möten

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Vinnare, p2.name AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE (p1.name LIKE '%Jannik Sinner%' AND p2.name LIKE '%Carlos Alcaraz%') OR (p1.name LIKE '%Carlos Alcaraz%' AND p2.name LIKE '%Jannik Sinner%') ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar alla inbördes möten mellan Jannik Sinner och Carlos Alcaraz."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Vinnare, p2.name AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE (p1.name LIKE '%Jannik Sinner%' AND p2.name LIKE '%Carlos Alcaraz%') OR (p1.name LIKE '%Carlos Alcaraz%' AND p2.name LIKE '%Jannik Sinner%') ORDER BY e.date DESC LIMIT 100;
```

Genom denna grundliga statistik kan vi nu betrakta tennisspelets intrikata väv av prestationer såsom Sinners och Alcaraz's laddade dueller på banan. En episk rivalitet i vardande, kanske?

## Fråga
Om Connors hade varit aktiv idag, hur hade han stått sig mot dagens elitspelare?

### Svar
Ah, en klassisk fråga om "tänk om" i tennisens alternativa universum. Om vi föreställer oss att Jimmy Connors, med sin oöverträffade vilja och uthållighet, vore aktiv idag, skulle en jämförelse i modern statistik och spelstil ge en hint om hans konkurrenskraft.

**Jimmy Connors' Kvaliteter:**
- **Fighting Spirit**: Känd för sin envetenhet och förmåga att kämpa sig ur svåra situationer, vilket skulle vara en fördel mot dagens tryck.
- **Allroundspelare**: Hans förmåga att spela effektivt från alla delar av banan skulle anpassas väl till dagens varierande spelytor.
- **Teknik och Mentaliteten**: Även om racketar har förändrats dramatiskt, är baserna i hans teknik och hans mentala styrka fortfarande viktiga kvaliteter.

**Utmaningar i dagens spel:**
- **Fart och Fysik**: Dagens spelare är starkare och snabbare. Connors skulle behöva hålla jämna steg med den ökade fysikaliteten hos dagens toppspelare.
- **Teknologiska Framsteg**: Moderna racketar och strängteknologi påverkar spelet kraftigt, vilket kan ha ändrat Connors sätt att spela om han var en del av dagens tur.

**Slutsats:**
Att säga exakt hur Connors skulle stå sig är naturligtvis spekulativt, men baserat på hans historiska bedrifter och anpassningsförmåga skulle han sannolikt ha varit en formidabel motståndare även bland dagens elit. Hans legendariska envishet och viljestyrka skulle ha gett honom en chans att briljera, särskilt i matcher där mental styrka är lika viktig som fysisk. Som att ge honom en babelfisk för dagens konkurrens, kan man säga.

Tennishistorien bär många vad-om scenarier, och detta är ett av de mer fascinerande.

## Fråga
Vilka underlag trivs Ruud bäst på?

### Svar
Casper Ruud har visat särskild framgång på grusunderlag. Hans spelsätt, med starka grundslag och förmågan att generera topspin, lämpar sig väl för grus, som ofta saktar ner spelet och ger honom tid att utnyttja sina kraftfulla slag. Denna yta gynnar också hans robusta försvarsspel.

I ett tennisuniversum där varje spelares framgångar ger ledtrådar om deras favoritunderlag, är det tydligt att Ruud har en benägenhet för grus. Han har samlat flera titlar på denna yta och har levererat starka prestationer i turneringar som French Open, vilket ytterligare understryker hans styrka på grus.

Som en babelfisk förklarar språk, förklarar Casper Ruuds spelstil hans favoritunderlag klart och tydligt.

## Fråga
Visa datum då de topp-10 spelarna föddes. Visa även en kolumn med spelarens ålder.

### Svar
Här är en sammanställning av de tio bäst rankade spelarnas födelsedatum och deras ålder:

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, DATE_FORMAT(birthdate, '%Y-%m-%d') AS Födelsedatum, IF(active, age, 'N/A') AS Ålder FROM players WHERE rank IS NOT NULL ORDER BY rank LIMIT 10",
  "comment": "Visar födelsedatum och ålder för de 10 bäst rankade spelarna."
}
```

```sql
SELECT name AS Namn, DATE_FORMAT(birthdate, '%Y-%m-%d') AS Födelsedatum, IF(active, age, 'N/A') AS Ålder FROM players WHERE rank IS NOT NULL ORDER BY rank LIMIT 10;
```

Denna tabell påminner oss om att åldern inom tennis inte alltid är ett hinder utan ofta en indikation på större erfarenhet och taktik. Som en välplacerad smash som slår rakt igenom tiden!

## Fråga
Jämför Rune och Ruud.

❌ Fel vid fråga "Jämför Rune och Ruud.": OpenAI run failed: Run status is failed

## Fråga
Jämför Federer, Nadal och Djokovic.

### Svar
Här är en detaljerad jämförelse av Roger Federer, Rafael Nadal och Novak Djokovic baserat på information från databasen. Vi börjar med deras persondata, fortsätter med titlar, vinster samt förluster, och avslutar med inbördes möten.

### Roger Federer

1. **Persondata:**

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Roger Federer%' LIMIT 100",
  "comment": "Visar persondata för Roger Federer som namn, land, ålder, aktuell ranking och bästa ranking."
}
```

```sql
SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Roger Federer%' LIMIT 100;
```

2. **Titlar Grupperade per Typ:**

```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Roger Federer%' AND m.round = 'F' GROUP BY e.type LIMIT 100",
  "comment": "Visar alla turneringar Roger Federer har vunnit, grupperat efter typ av turnering."
}
```

```sql
SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Roger Federer%' AND m.round = 'F' GROUP BY e.type LIMIT 100;
```

3. **Vinster mot Topp-20 Spelare Senaste Året:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Roger Federer%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka topp-20 spelare Roger Federer har vunnit mot under det senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Roger Federer%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC LIMIT 100;
```

4. **Vinster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Roger Federer%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka matcher Roger Federer har vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Roger Federer%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100;
```

5. **Förluster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Roger Federer%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka matcher Roger Federer har förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Roger Federer%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100;
```

### Rafael Nadal

1. **Persondata:**

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Rafael Nadal%' LIMIT 100",
  "comment": "Visar persondata för Rafael Nadal som namn, land, ålder, aktuell ranking och bästa ranking."
}
```

```sql
SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Rafael Nadal%' LIMIT 100;
```

2. **Titlar Grupperade per Typ:**

```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Rafael Nadal%' AND m.round = 'F' GROUP BY e.type LIMIT 100",
  "comment": "Visar alla turneringar Rafael Nadal har vunnit, grupperat efter typ av turnering."
}
```

```sql
SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Rafael Nadal%' AND m.round = 'F' GROUP BY e.type LIMIT 100;
```

3. **Vinster mot Topp-20 Spelare Senaste Året:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Rafael Nadal%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka topp-20 spelare Rafael Nadal har vunnit mot under det senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Rafael Nadal%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC LIMIT 100;
```

4. **Vinster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Rafael Nadal%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka matcher Rafael Nadal har vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Rafael Nadal%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100;
```

5. **Förluster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Rafael Nadal%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka matcher Rafael Nadal har förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Rafael Nadal%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100;
```

### Novak Djokovic

1. **Persondata:**

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Novak Djokovic%' LIMIT 100",
  "comment": "Visar persondata för Novak Djokovic som namn, land, ålder, aktuell ranking och bästa ranking."
}
```

```sql
SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Novak Djokovic%' LIMIT 100;
```

2. **Titlar Grupperade per Typ:**

```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Novak Djokovic%' AND m.round = 'F' GROUP BY e.type LIMIT 100",
  "comment": "Visar alla turneringar Novak Djokovic har vunnit, grupperat efter typ av turnering."
}
```

```sql
SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Novak Djokovic%' AND m.round = 'F' GROUP BY e.type LIMIT 100;
```

3. **Vinster mot Topp-20 Spelare Senaste Året:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Novak Djokovic%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka topp-20 spelare Novak Djokovic har vunnit mot under det senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Novak Djokovic%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC LIMIT 100;
```

4. **Vinster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Novak Djokovic%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka matcher Novak Djokovic har vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Novak Djokovic%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100;
```

5. **Förluster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Novak Djokovic%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka matcher Novak Djokovic har förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Novak Djokovic%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100;
```

### Inbördes Möten

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Vinnare, p2.name AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE (p1.name LIKE '%Roger Federer%' AND p2.name LIKE '%Rafael Nadal%') OR (p1.name LIKE '%Rafael Nadal%' AND p2.name LIKE '%Roger Federer%') OR (p1.name LIKE '%Roger Federer%' AND p2.name LIKE '%Novak Djokovic%') OR (p1.name LIKE '%Novak Djokovic%' AND p2.name LIKE '%Roger Federer%') OR (p1.name LIKE '%Rafael Nadal%' AND p2.name LIKE '%Novak Djokovic%') OR (p1.name LIKE '%Novak Djokovic%' AND p2.name LIKE '%Rafael Nadal%') ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar alla inbördes möten mellan Roger Federer, Rafael Nadal och Novak Djokovic."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Vinnare, p2.name AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE (p1.name LIKE '%Roger Federer%' AND p2.name LIKE '%Rafael Nadal%') OR (p1.name LIKE '%Rafael Nadal%' AND p2.name LIKE '%Roger Federer%') OR (p1.name LIKE '%Roger Federer%' AND p2.name LIKE '%Novak Djokovic%') OR (p1.name LIKE '%Novak Djokovic%' AND p2.name LIKE '%Roger Federer%') OR (p1.name LIKE '%Rafael Nadal%' AND p2.name LIKE '%Novak Djokovic%') OR (p1.name LIKE '%Novak Djokovic%' AND p2.name LIKE '%Rafael Nadal%') ORDER BY e.date DESC LIMIT 100;
```

Det här är verkligen en episk rivalitet, tre av de mest dominerande spelarna i tennisens historia. Om tennisuniversumet var en orkan, skulle deras möten vara dess öga – intensivt, fokusfyllt, och i en kontinuerlig virvel av briljans.

## Fråga
Stan Wawrinka är intressant, vad vet du om honom?

### Svar
Här är en analys av Stan Wawrinka baserat på den data som finns tillgänglig i databasen:

1. **Persondata:**

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Stan Wawrinka%' LIMIT 100",
  "comment": "Visar persondata för Stan Wawrinka, såsom namn, land, ålder, aktuell ranking och bästa ranking."
}
```

```sql
SELECT name AS Namn, country AS Land, IF(active, age, 'N/A') AS Ålder, IF(active, rank, 'N/A') AS `Aktuell Rank`, highest_rank AS `Bästa Rank`, DATE_FORMAT(highest_rank_date, '%Y-%m-%d') AS `Datum Bästa Rank` FROM players WHERE name LIKE '%Stan Wawrinka%' LIMIT 100;
```

2. **Titlar Grupperade per Typ:**

```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Stan Wawrinka%' AND m.round = 'F' GROUP BY e.type LIMIT 100",
  "comment": "Visar alla turneringar Stan Wawrinka har vunnit, grupperat efter typ av turnering."
}
```

```sql
SELECT e.type AS Typ, COUNT(m.id) AS Antal_Titlar FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE p.name LIKE '%Stan Wawrinka%' AND m.round = 'F' GROUP BY e.type LIMIT 100;
```

3. **Vinster mot Topp-20 Spelare Senaste Året:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Stan Wawrinka%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka topp-20 spelare Stan Wawrinka har vunnit mot under det senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Stan Wawrinka%' AND p2.rank <= 20 AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC LIMIT 100;
```

4. **Vinster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Stan Wawrinka%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka matcher Stan Wawrinka har vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p2.name AS Motståndare, p2.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p1.name LIKE '%Stan Wawrinka%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100;
```

5. **Förluster de Senaste Tre Månaderna:**

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Stan Wawrinka%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100",
  "comment": "Visar vilka matcher Stan Wawrinka har förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p1.name AS Motståndare, p1.rank AS `Motståndare Rank`, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id JOIN players p1 ON m.winner = p1.id JOIN players p2 ON m.loser = p2.id WHERE p2.name LIKE '%Stan Wawrinka%' AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC LIMIT 100;
```

Stan Wawrinka, känd för sin kraftfulla enhandsslag och psykologiska uthållighet, har en förmåga att lysa i stora turneringar. En spelare av episka proportioner i ett tennisspektrum fyllt av stjärnor.

## Fråga
Visa en lista på de som vunnit flest titlar i år.

❌ Fel vid fråga "Visa en lista på de som vunnit flest titlar i år.": OpenAI run failed: Run status is failed

## Fråga
Visa alla spelare som vunnit en Wimbledon.

### Svar
Här är en lista över spelare som har vunnit Wimbledon:

```json
{
  "content-type": "Query",
  "query": "SELECT DISTINCT p.name AS Namn FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE e.name = 'Wimbledon' AND m.round = 'F' LIMIT 100",
  "comment": "Visar alla spelare som har vunnit Wimbledon."
}
```

```sql
SELECT DISTINCT p.name AS Namn FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE e.name = 'Wimbledon' AND m.round = 'F' LIMIT 100;
```

## Fråga
Jämför Sinner, Alcaraz och Zverev.

❌ Fel vid fråga "Jämför Sinner, Alcaraz och Zverev.": OpenAI run failed: Run status is failed

## Fråga
Visa alla amerikanska spelare sorterat efter ranking.

### Svar
Här är en lista över alla amerikanska spelare, sorterade efter deras aktuella ranking:

```json
{
  "content-type": "Query",
  "query": "SELECT name AS Namn, IF(active, rank, 'N/A') AS Rank FROM players WHERE country = 'USA' ORDER BY Rank IS NULL, Rank LIMIT 100",
  "comment": "Visar alla spelare från USA och deras aktuella ranking, sorterade så att rankade spelare visas först."
}
```

```sql
SELECT name AS Namn, IF(active, rank, 'N/A') AS Rank FROM players WHERE country = 'USA' ORDER BY Rank IS NULL, Rank LIMIT 100;
```

## Fråga
Visa de 10 bästa tennisspelarna genom tiderna baserat på antalet vunna Grand Slam- och Masters-titlar, sorterat efter flest Grand Slam-titlar med en kolumn för varje titeltyp

### Svar
Här är en sammanställning av de tio bästa tennisspelarna baserat på antalet vunna Grand Slam- och Masters-titlar, sorterat efter flest Grand Slam-titlar:

```json
{
  "content-type": "Query",
  "query": "SELECT p.name AS Namn, COUNT(CASE WHEN e.type = 'Grand Slam' THEN 1 END) AS `Grand Slam Titlar`, COUNT(CASE WHEN e.type = 'Masters' THEN 1 END) AS `Masters Titlar` FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE m.round = 'F' AND (e.type = 'Grand Slam' OR e.type = 'Masters') GROUP BY p.name ORDER BY `Grand Slam Titlar` DESC, `Masters Titlar` DESC LIMIT 10",
  "comment": "Visar de 10 bästa tennisspelarna baserat på antalet vunna Grand Slam och Masters titlar, sorterat efter flest Grand Slam titlar."
}
```

```sql
SELECT p.name AS Namn, COUNT(CASE WHEN e.type = 'Grand Slam' THEN 1 END) AS `Grand Slam Titlar`, COUNT(CASE WHEN e.type = 'Masters' THEN 1 END) AS `Masters Titlar` FROM matches m JOIN events e ON m.event = e.id JOIN players p ON m.winner = p.id WHERE m.round = 'F' AND (e.type = 'Grand Slam' OR e.type = 'Masters') GROUP BY p.name ORDER BY `Grand Slam Titlar` DESC, `Masters Titlar` DESC LIMIT 10;
```

Detta ger en glimt av tennisens aristokrati – spelarna som har erövrat de mest prestigefyllda titlarna i sportens historia. Om tennis var en episk saga skulle dessa mästare agera som hjältar i dess mest minnesvärda kapitel.

## Fråga
Gruppera spelare efter det decennium de föddes i och summera antalet Grand Slam-titlar de har vunnit. Uteslut spelare med okända födelsedatum.

❌ Fel vid fråga "Gruppera spelare efter det decennium de föddes i och summera antalet Grand Slam-titlar de har vunnit. Uteslut spelare med okända födelsedatum.": OpenAI run failed: Run status is failed

## Fråga
Vem tränar Sinner?

❌ Fel vid fråga "Vem tränar Sinner?": OpenAI run failed: Run status is failed

## Fråga
Visa de 10 spelare som har tjänat mest prispengar genom sina karriärer.

❌ Fel vid fråga "Visa de 10 spelare som har tjänat mest prispengar genom sina karriärer.": OpenAI run failed: Run status is failed

## Fråga
Vilken är den längsta matchen genom tiderna. Du får gärna komplettera med egen information som du hittar.

❌ Fel vid fråga "Vilken är den längsta matchen genom tiderna. Du får gärna komplettera med egen information som du hittar.": OpenAI run failed: Run status is failed

## Fråga
Ange i procent hur många matcher Sinner haft en match med tie-break. Visa även de matcherna.

❌ Fel vid fråga "Ange i procent hur många matcher Sinner haft en match med tie-break. Visa även de matcherna.": OpenAI run failed: Run status is failed
