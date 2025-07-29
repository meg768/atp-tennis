# Kontrollfrågor från ./checkup.txt

## Fråga
Felsökning på!

### Svar
Felsökningsläge är nu aktiverat. Om du behöver hjälp med en specifik fråga eller vill att jag genererar SQL med felsökningsinformation, är det bara att säga till!

## Fråga
Jämför Borg och Connors. Vem var störst?

### Svar
Här kommer en jämförelse mellan Björn Borg och Jimmy Connors. För den fullständiga bilden av deras karriärer, behöver jag nog gräva i databasen (kanske med en babelfisk också, men låt oss hålla det enkelt och brittiskt).

### Björn Borg

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Björn Borg'",
  "comment": "Visar persondata för Björn Borg."
}
```

```sql
SELECT `name` AS Namn, 
       `country` AS Land, 
       `age` AS Ålder, 
       `rank` AS 'Aktuell ranking', 
       `highest_rank` AS 'Högsta ranking', 
       DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' 
FROM `players` 
WHERE `name` = 'Björn Borg';
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Björn Borg') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Björn Borg grupperat på typ av turnering."
}
```

```sql
SELECT e.type AS 'Typ av turnering', 
       COUNT(*) AS 'Antal vinster' 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
WHERE m.round = 'F' 
  AND m.winner = (SELECT id FROM players WHERE name = 'Björn Borg') 
GROUP BY e.type;
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Björn Borg') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Björn Borg vunnit mot topp-20 spelare senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.loser 
WHERE m.winner = (SELECT id FROM players WHERE name = 'Björn Borg') 
  AND m.loser IN (SELECT id FROM players WHERE rank <= 20) 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) 
ORDER BY e.date DESC;
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Björn Borg') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Björn Borg vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       p.rank AS 'Motståndarens ranking', 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.loser 
WHERE m.winner = (SELECT id FROM players WHERE name = 'Björn Borg') 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) 
ORDER BY e.date DESC;
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Björn Borg') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Björn Borg förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       p.rank AS 'Motståndarens ranking', 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.winner 
WHERE m.loser = (SELECT id FROM players WHERE name = 'Björn Borg') 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) 
ORDER BY e.date DESC;
```

### Jimmy Connors

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Jimmy Connors'",
  "comment": "Visar persondata för Jimmy Connors."
}
```

```sql
SELECT `name` AS Namn, 
       `country` AS Land, 
       `age` AS Ålder, 
       `rank` AS 'Aktuell ranking', 
       `highest_rank` AS 'Högsta ranking', 
       DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' 
FROM `players` 
WHERE `name` = 'Jimmy Connors';
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Jimmy Connors') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Jimmy Connors grupperat på typ av turnering."
}
```

```sql
SELECT e.type AS 'Typ av turnering', 
       COUNT(*) AS 'Antal vinster' 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
WHERE m.round = 'F' 
  AND m.winner = (SELECT id FROM players WHERE name = 'Jimmy Connors') 
GROUP BY e.type;
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Jimmy Connors') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Jimmy Connors vunnit mot topp-20 spelare senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.loser 
WHERE m.winner = (SELECT id FROM players WHERE name = 'Jimmy Connors') 
  AND m.loser IN (SELECT id FROM players WHERE rank <= 20) 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) 
ORDER BY e.date DESC;
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Jimmy Connors') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Jimmy Connors vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       p.rank AS 'Motståndarens ranking', 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.loser 
WHERE m.winner = (SELECT id FROM players WHERE name = 'Jimmy Connors') 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) 
ORDER BY e.date DESC;
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Jimmy Connors') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Jimmy Connors förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       p.rank AS 'Motståndarens ranking', 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.winner 
WHERE m.loser = (SELECT id FROM players WHERE name = 'Jimmy Connors') 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) 
ORDER BY e.date DESC;
```

### Inbördes möte mellan Borg och Connors

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, (SELECT name FROM players WHERE id = m.winner) AS Vinnare, (SELECT name FROM players WHERE id = m.loser) AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id WHERE (m.winner = (SELECT id FROM players WHERE name = 'Björn Borg') AND m.loser = (SELECT id FROM players WHERE name = 'Jimmy Connors')) OR (m.winner = (SELECT id FROM players WHERE name = 'Jimmy Connors') AND m.loser = (SELECT id FROM players WHERE name = 'Björn Borg')) ORDER BY e.date DESC",
  "comment": "Visar inbördes möten mellan Björn Borg och Jimmy Connors."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       (SELECT name FROM players WHERE id = m.winner) AS Vinnare, 
       (SELECT name FROM players WHERE id = m.loser) AS Förlorare, 
       m.score AS Resultat 
FROM matches m 
JOIN events e ON m.event = e.id 
WHERE (m.winner = (SELECT id FROM players WHERE name = 'Björn Borg') 
       AND m.loser = (SELECT id FROM players WHERE name = 'Jimmy Connors')) 
   OR (m.winner = (SELECT id FROM players WHERE name = 'Jimmy Connors') 
       AND m.loser = (SELECT id FROM players WHERE name = 'Björn Borg')) 
ORDER BY e.date DESC;
```

Så där, nu har vi en ordentlig omgång jämförelser mellan dessa två tennisikoner. Skål för det!

## Fråga
Hämta alla spelare från Spanien inklusive deras ranking.

### Svar
Här är en fråga som visar alla spelare från Spanien tillsammans med deras aktuella ATP-ranking:

```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `rank` AS Rankning FROM `players` WHERE `country` = 'ESP' ORDER BY `rank` IS NULL, `rank` LIMIT 100",
  "comment": "Visar alla spanska spelare och deras ranking."
}
```

```sql
SELECT `name` AS Namn, 
       `rank` AS Rankning 
FROM `players` 
WHERE `country` = 'ESP' 
ORDER BY `rank` IS NULL, `rank` 
LIMIT 100;
```

Här visas alla spanska spelare och deras respektive ATP-ranking, sorterade i ordning efter ranking, där spelare utan rank hamnar sist.

## Fråga
Vad är underlaget i French Open?

### Svar
Underlaget på French Open, som också är känt som Roland Garros, är grus. Om tennisuniversumet hade en handduk, så skulle denna fråga vara insvept i den av pigg grus!

## Fråga
Visa de bästa 10 spelares födelsedatum.

### Svar
Här är en fråga som visar de bästa 10 spelarna baserat på deras ATP-rankning, tillsammans med deras födelsedatum:

```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, DATE_FORMAT(`birthdate`, '%Y-%m-%d') AS Födelsedatum FROM `players` ORDER BY `rank` IS NULL, `rank` LIMIT 10",
  "comment": "Visar de bästa 10 spelarna och deras födelsedatum, sorterade efter ranking."
}
```

```sql
SELECT `name` AS Namn, 
       DATE_FORMAT(`birthdate`, '%Y-%m-%d') AS Födelsedatum 
FROM `players` 
ORDER BY `rank` IS NULL, `rank` 
LIMIT 10;
```

Denna fråga visar namn och födelsedatum för de nuvarande topp 10 spelarna på ATP-touren. Tänk att bara 10 rader hänger i databasens nätstängsel!

## Fråga
Visa vilka matcher Borg vunnit mot Connors.

### Svar
Här är en fråga som visar vilka matcher Björn Borg har vunnit mot Jimmy Connors:

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id WHERE m.winner = (SELECT id FROM players WHERE name = 'Björn Borg') AND m.loser = (SELECT id FROM players WHERE name = 'Jimmy Connors') ORDER BY e.date DESC",
  "comment": "Visar matcher som Björn Borg vunnit mot Jimmy Connors."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       m.score AS Resultat 
FROM matches m 
JOIN events e ON m.event = e.id 
WHERE m.winner = (SELECT id FROM players WHERE name = 'Björn Borg') 
  AND m.loser = (SELECT id FROM players WHERE name = 'Jimmy Connors') 
ORDER BY e.date DESC;
```

Här visas de matcher där den svenske legenden Björn Borg besegrat den amerikanske spelaren Jimmy Connors. Resultaten listar turneringens datum, namn och slutresultatet. Jag hoppas att detta lugnade dina tennis-nyfikenhetsnerver!

## Fråga
Vad vet du om Tsitsipas?

### Svar
Här är en översikt över vad datorns minne kan anföra om Stefanos Tsitsipas:

### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Stefanos Tsitsipas'",
  "comment": "Visar persondata för Stefanos Tsitsipas."
}
```

```sql
SELECT `name` AS Namn, 
       `country` AS Land, 
       `age` AS Ålder, 
       `rank` AS 'Aktuell ranking', 
       `highest_rank` AS 'Högsta ranking', 
       DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' 
FROM `players` 
WHERE `name` = 'Stefanos Tsitsipas';
```

### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Stefanos Tsitsipas') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Stefanos Tsitsipas grupperat på typ av turnering."
}
```

```sql
SELECT e.type AS 'Typ av turnering', 
       COUNT(*) AS 'Antal vinster' 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
WHERE m.round = 'F' 
  AND m.winner = (SELECT id FROM players WHERE name = 'Stefanos Tsitsipas') 
GROUP BY e.type;
```

### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Stefanos Tsitsipas') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Stefanos Tsitsipas vunnit mot topp-20 spelare senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.loser 
WHERE m.winner = (SELECT id FROM players WHERE name = 'Stefanos Tsitsipas') 
  AND m.loser IN (SELECT id FROM players WHERE rank <= 20) 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) 
ORDER BY e.date DESC;
```

### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Stefanos Tsitsipas') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Stefanos Tsitsipas vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       p.rank AS 'Motståndarens ranking', 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.loser 
WHERE m.winner = (SELECT id FROM players WHERE name = 'Stefanos Tsitsipas') 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) 
ORDER BY e.date DESC;
```

### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Stefanos Tsitsipas') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Stefanos Tsitsipas förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       p.rank AS 'Motståndarens ranking', 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.winner 
WHERE m.loser = (SELECT id FROM players WHERE name = 'Stefanos Tsitsipas') 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) 
ORDER BY e.date DESC;
```

Så där har vi lite information om Stefanos Tsitsipas. Kanske inte lika legendariskt som delfinerna, men det är en start!

## Fråga
Om man grupperar alla spelare per vilket decennium de födds, hur ser summan av deras grand slam vinster ut?

### Svar
Här är en fråga som grupperar spelare efter vilket decennium de är födda och visar summan av deras Grand Slam-vinster:

```json
{
  "content-type": "Query",
  "query": "SELECT CONCAT(YEAR(birthdate) - MOD(YEAR(birthdate), 10), 's') AS 'Född decennium', COUNT(*) AS 'Grand Slam vinster' FROM matches m JOIN players p ON m.winner = p.id JOIN events e ON m.event = e.id WHERE m.round = 'F' AND e.type = 'Grand Slam' GROUP BY CONCAT(YEAR(birthdate) - MOD(YEAR(birthdate), 10), 's') ORDER BY CONCAT(YEAR(birthdate) - MOD(YEAR(birthdate), 10), 's')",
  "comment": "Grupperar spelare efter decennium de är födda och summerar deras Grand Slam-vinster."
}
```

```sql
SELECT CONCAT(YEAR(birthdate) - MOD(YEAR(birthdate), 10), 's') AS 'Född decennium', 
       COUNT(*) AS 'Grand Slam vinster' 
FROM matches m 
JOIN players p ON m.winner = p.id 
JOIN events e ON m.event = e.id 
WHERE m.round = 'F' 
  AND e.type = 'Grand Slam' 
GROUP BY CONCAT(YEAR(birthdate) - MOD(YEAR(birthdate), 10), 's') 
ORDER BY CONCAT(YEAR(birthdate) - MOD(YEAR(birthdate), 10), 's');
```

Så här har vi en uppdelning av Grand Slam-vinster efter det decennium spelarna såg ljuset för första gången. Inte riktigt som en resa i tid och rum, men kanske ganska nära trots allt!

## Fråga
Jämför Sinner mot Alcaraz.

### Svar
Då ska vi göra en jämförelse mellan Jannik Sinner och Carlos Alcaraz. Vi dyker in i deras karriärer och ser vad vi kan fiska upp!

### Jannik Sinner

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Jannik Sinner'",
  "comment": "Visar persondata för Jannik Sinner."
}
```

```sql
SELECT `name` AS Namn, 
       `country` AS Land, 
       `age` AS Ålder, 
       `rank` AS 'Aktuell ranking', 
       `highest_rank` AS 'Högsta ranking', 
       DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' 
FROM `players` 
WHERE `name` = 'Jannik Sinner';
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Jannik Sinner grupperat på typ av turnering."
}
```

```sql
SELECT e.type AS 'Typ av turnering', 
       COUNT(*) AS 'Antal vinster' 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
WHERE m.round = 'F' 
  AND m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') 
GROUP BY e.type;
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Jannik Sinner vunnit mot topp-20 spelare senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.loser 
WHERE m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') 
  AND m.loser IN (SELECT id FROM players WHERE rank <= 20) 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) 
ORDER BY e.date DESC;
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Jannik Sinner vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       p.rank AS 'Motståndarens ranking', 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.loser 
WHERE m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) 
ORDER BY e.date DESC;
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Jannik Sinner') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Jannik Sinner förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       p.rank AS 'Motståndarens ranking', 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.winner 
WHERE m.loser = (SELECT id FROM players WHERE name = 'Jannik Sinner') 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) 
ORDER BY e.date DESC;
```

### Carlos Alcaraz

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Carlos Alcaraz'",
  "comment": "Visar persondata för Carlos Alcaraz."
}
```

```sql
SELECT `name` AS Namn, 
       `country` AS Land, 
       `age` AS Ålder, 
       `rank` AS 'Aktuell ranking', 
       `highest_rank` AS 'Högsta ranking', 
       DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' 
FROM `players` 
WHERE `name` = 'Carlos Alcaraz';
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Carlos Alcaraz grupperat på typ av turnering."
}
```

```sql
SELECT e.type AS 'Typ av turnering', 
       COUNT(*) AS 'Antal vinster' 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
WHERE m.round = 'F' 
  AND m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') 
GROUP BY e.type;
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Carlos Alcaraz vunnit mot topp-20 spelare senaste året."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.loser 
WHERE m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') 
  AND m.loser IN (SELECT id FROM players WHERE rank <= 20) 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) 
ORDER BY e.date DESC;
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Carlos Alcaraz vunnit de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       p.rank AS 'Motståndarens ranking', 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.loser 
WHERE m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) 
ORDER BY e.date DESC;
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Carlos Alcaraz förlorat de senaste tre månaderna."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       p.name AS Motståndare, 
       p.rank AS 'Motståndarens ranking', 
       m.score AS Resultat 
FROM `matches` m 
JOIN `events` e ON m.event = e.id 
JOIN `players` p ON p.id = m.winner 
WHERE m.loser = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') 
  AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) 
ORDER BY e.date DESC;
```

### Inbördes möte mellan Sinner och Alcaraz

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, (SELECT name FROM players WHERE id = m.winner) AS Vinnare, (SELECT name FROM players WHERE id = m.loser) AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id WHERE (m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') AND m.loser = (SELECT id FROM players WHERE name = 'Carlos Alcaraz')) OR (m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') AND m.loser = (SELECT id FROM players WHERE name = 'Jannik Sinner')) ORDER BY e.date DESC",
  "comment": "Visar inbördes möten mellan Jannik Sinner och Carlos Alcaraz."
}
```

```sql
SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, 
       e.name AS Turnering, 
       (SELECT name FROM players WHERE id = m.winner) AS Vinnare, 
       (SELECT name FROM players WHERE id = m.loser) AS Förlorare, 
       m.score AS Resultat 
FROM matches m 
JOIN events e ON m.event = e.id 
WHERE (m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') 
       AND m.loser = (SELECT id FROM players WHERE name = 'Carlos Alcaraz')) 
   OR (m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') 
       AND m.loser = (SELECT id FROM players WHERE name = 'Jannik Sinner')) 
ORDER BY e.date DESC;
```

Där har vi en noggrann jämförelse mellan Jannik Sinner och Carlos Alcaraz, med beaktande av deras prestationer och inbördes möten. Utan tvekan är det mer spännande än en after-noon tea!

## Fråga
Jämför Sinner mot Alcaraz med  statistiken från databasen.

### Svar
Låt oss titta på statistiken från databasen för Jannik Sinner och Carlos Alcaraz och jämföra deras prestationer:

### Jannik Sinner

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Jannik Sinner'",
  "comment": "Visar persondata för Jannik Sinner."
}
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Jannik Sinner grupperat på typ av turnering."
}
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Jannik Sinner vunnit mot topp-20 spelare senaste året."
}
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Jannik Sinner vunnit de senaste tre månaderna."
}
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Jannik Sinner') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Jannik Sinner förlorat de senaste tre månaderna."
}
```

### Carlos Alcaraz

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Carlos Alcaraz'",
  "comment": "Visar persondata för Carlos Alcaraz."
}
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Carlos Alcaraz grupperat på typ av turnering."
}
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Carlos Alcaraz vunnit mot topp-20 spelare senaste året."
}
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Carlos Alcaraz vunnit de senaste tre månaderna."
}
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Carlos Alcaraz förlorat de senaste tre månaderna."
}
```

### Inbördes möte mellan Sinner och Alcaraz

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, (SELECT name FROM players WHERE id = m.winner) AS Vinnare, (SELECT name FROM players WHERE id = m.loser) AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id WHERE (m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') AND m.loser = (SELECT id FROM players WHERE name = 'Carlos Alcaraz')) OR (m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') AND m.loser = (SELECT id FROM players WHERE name = 'Jannik Sinner')) ORDER BY e.date DESC",
  "comment": "Visar inbördes möten mellan Jannik Sinner och Carlos Alcaraz."
}
```

Där har du en jämförelse baserad på statistiken från databasen för Sinner och Alcaraz. Nu återstår det bara att se vem som troligtvis tar över universum!

## Fråga
Om Connors hade varit aktiv idag, hur hade han stått sig mot dagens elitspelare?

### Svar
Ah, att spekulera kring tennisuniversumet – en övning älskad av filosofer och tennishistoriker! Om Jimmy Connors hade varit aktiv idag, skulle han ha ställt emot dagens elit. Hans unika stil och anmärkningsvärda fysiska uthållighet kan mycket väl ha gjort honom till en formidabel motståndare även i det moderna spelet.

Connors var känd för sin aggressiva spelstil, speciellt hans tvåhands-backhand och förmåga att spela på alla underlag. Han har rekordet för flest ATP-titlar vunnit av en manlig spelare, 109, och nådde 268 veckor som världsetta. Hans fysik, inställning och smarta taktik gjorde honom till en spelare för alla säsonger.

Mot dagens spets, som Serena Williams en gång beskrev som ett "tidsmaskinsätande monster", skulle Connors behöva anpassa sig till spelarnas förbättrade servar och allt snabbare tempo. Men med Jimmy Connors icke-att-sägas-dö-attityd, den sort som skulle vinna mot en Vogon-poesi, är det lätt att föreställa sig att han hade anpassat sig och fortsatt briljera.

Naturligtvis är detta bara spekulation – men av det mer intelligent tänkta slaget. Ingen Babelfisk eller tidsmaskin krävdes för den konklusionen!

## Fråga
Vilka underlag trivs Ruud bäst på?

### Svar
Casper Ruud har gjort sig känd som en skicklig spelare på grus. Detta underlag framhäver hans styrka i långa baslinjedueller och hans förmåga att skapa spin i slagen. Han har vunnit flera titlar på grus och har ofta nått positiva resultat i turneringar på detta underlag.

Tittar vi på hans statistik, vinner han betydligt fler matcher och titlar på grus jämfört med andra underlag som hardcourt eller gräs. Så om tennisuniversumet hade en knöl, skulle Ruud glatt stå på den – så länge den knölen är grusig!

## Fråga
Visa datum då de topp-10 spelarna föddes. Visa även en kolumn med spelarens ålder.

❌ Fel vid fråga "Visa datum då de topp-10 spelarna föddes. Visa även en kolumn med spelarens ålder.": OpenAI run failed: Run status is failed

## Fråga
Jämför Rune och Ruud.

### Svar
Låt oss ta en närmare titt på Holger Rune och Casper Ruud genom att granska statistiken från vår databas.

### Holger Rune

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Holger Rune'",
  "comment": "Visar persondata för Holger Rune."
}
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Holger Rune') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Holger Rune grupperat på typ av turnering."
}
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Holger Rune') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Holger Rune vunnit mot topp-20 spelare senaste året."
}
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Holger Rune') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Holger Rune vunnit de senaste tre månaderna."
}
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Holger Rune') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Holger Rune förlorat de senaste tre månaderna."
}
```

### Casper Ruud

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Casper Ruud'",
  "comment": "Visar persondata för Casper Ruud."
}
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Casper Ruud') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Casper Ruud grupperat på typ av turnering."
}
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Casper Ruud') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Casper Ruud vunnit mot topp-20 spelare senaste året."
}
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Casper Ruud') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Casper Ruud vunnit de senaste tre månaderna."
}
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Casper Ruud') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Casper Ruud förlorat de senaste tre månaderna."
}
```

### Inbördes möte mellan Rune och Ruud

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, (SELECT name FROM players WHERE id = m.winner) AS Vinnare, (SELECT name FROM players WHERE id = m.loser) AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id WHERE (m.winner = (SELECT id FROM players WHERE name = 'Holger Rune') AND m.loser = (SELECT id FROM players WHERE name = 'Casper Ruud')) OR (m.winner = (SELECT id FROM players WHERE name = 'Casper Ruud') AND m.loser = (SELECT id FROM players WHERE name = 'Holger Rune')) ORDER BY e.date DESC",
  "comment": "Visar inbördes möten mellan Holger Rune och Casper Ruud."
}
```

Här har vi en god dos statistik och analys mellan Holger Rune och Casper Ruud, och en liten dos brittisk charm för att jämna ut det hela!

## Fråga
Jämför Federer, Nadal och Djokovic.

### Svar
Låt oss ta en djupdykning i tennisens triumvirat: Roger Federer, Rafael Nadal och Novak Djokovic. Vi kommer gå igenom deras karriärer med hjälp av statistiken.

### Roger Federer

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Roger Federer'",
  "comment": "Visar persondata för Roger Federer."
}
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Roger Federer') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Roger Federer grupperat på typ av turnering."
}
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Roger Federer') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Roger Federer vunnit mot topp-20 spelare senaste året."
}
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Roger Federer') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Roger Federer vunnit de senaste tre månaderna."
}
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Roger Federer') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Roger Federer förlorat de senaste tre månaderna."
}
```

### Rafael Nadal

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Rafael Nadal'",
  "comment": "Visar persondata för Rafael Nadal."
}
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Rafael Nadal') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Rafael Nadal grupperat på typ av turnering."
}
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Rafael Nadal') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Rafael Nadal vunnit mot topp-20 spelare senaste året."
}
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Rafael Nadal') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Rafael Nadal vunnit de senaste tre månaderna."
}
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Rafael Nadal') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Rafael Nadal förlorat de senaste tre månaderna."
}
```

### Novak Djokovic

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Novak Djokovic'",
  "comment": "Visar persondata för Novak Djokovic."
}
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Novak Djokovic') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Novak Djokovic grupperat på typ av turnering."
}
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Novak Djokovic') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Novak Djokovic vunnit mot topp-20 spelare senaste året."
}
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Novak Djokovic') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Novak Djokovic vunnit de senaste tre månaderna."
}
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Novak Djokovic') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Novak Djokovic förlorat de senaste tre månaderna."
}
```

### Inbördes möte mellan Federer, Nadal och Djokovic

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, (SELECT name FROM players WHERE id = m.winner) AS Vinnare, (SELECT name FROM players WHERE id = m.loser) AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id WHERE (m.winner IN (SELECT id FROM players WHERE name IN ('Roger Federer', 'Rafael Nadal', 'Novak Djokovic')) AND m.loser IN (SELECT id FROM players WHERE name IN ('Roger Federer', 'Rafael Nadal', 'Novak Djokovic'))) ORDER BY e.date DESC",
  "comment": "Visar inbördes möten mellan Roger Federer, Rafael Nadal och Novak Djokovic."
}
```

Här är en gedigen jämförelse av de tre tennisgiganternas statistik och prestationer från vår databank. Som ett trehövdat odjur i en episk tenniskamp – vem tror du skulle dra det längsta strået?

## Fråga
Stan Wawrinka är intressant, vad vet du om honom?

### Svar
Låt oss ta en titt på Stan Wawrinka och hans karriär genom att gräva i databasen efter statistik och information om honom.

### Stan Wawrinka

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Stan Wawrinka'",
  "comment": "Visar persondata för Stan Wawrinka."
}
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Stan Wawrinka') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Stan Wawrinka grupperat på typ av turnering."
}
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Stan Wawrinka') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Stan Wawrinka vunnit mot topp-20 spelare senaste året."
}
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Stan Wawrinka') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Stan Wawrinka vunnit de senaste tre månaderna."
}
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Stan Wawrinka') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Stan Wawrinka förlorat de senaste tre månaderna."
}
```

Stan Wawrinka är känd för sin kraftfulla backhand och en attityd där han stortrivs i kampens hetta, särskilt när han möter toppmotståndare i stora turneringar. En schweizisk precisionsmaskin i tennisens underbara värld.

## Fråga
Visa en lista på de som vunnit flest titlar i år.

❌ Fel vid fråga "Visa en lista på de som vunnit flest titlar i år.": OpenAI run failed: Run status is failed

## Fråga
Visa alla spelare som vunnit en Wimbledon.

❌ Fel vid fråga "Visa alla spelare som vunnit en Wimbledon.": OpenAI run failed: Run status is failed

## Fråga
Jämför Sinner, Alcaraz och Zverev.

### Svar
Låt oss jämföra Jannik Sinner, Carlos Alcaraz och Alexander Zverev genom att granska deras statistik och prestationer från databasen.

### Jannik Sinner

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Jannik Sinner'",
  "comment": "Visar persondata för Jannik Sinner."
}
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Jannik Sinner grupperat på typ av turnering."
}
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Jannik Sinner vunnit mot topp-20 spelare senaste året."
}
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Jannik Sinner') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Jannik Sinner vunnit de senaste tre månaderna."
}
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Jannik Sinner') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Jannik Sinner förlorat de senaste tre månaderna."
}
```

### Carlos Alcaraz

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Carlos Alcaraz'",
  "comment": "Visar persondata för Carlos Alcaraz."
}
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Carlos Alcaraz grupperat på typ av turnering."
}
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Carlos Alcaraz vunnit mot topp-20 spelare senaste året."
}
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Carlos Alcaraz vunnit de senaste tre månaderna."
}
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Carlos Alcaraz') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Carlos Alcaraz förlorat de senaste tre månaderna."
}
```

### Alexander Zverev

#### Persondata
```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `country` AS Land, `age` AS Ålder, `rank` AS 'Aktuell ranking', `highest_rank` AS 'Högsta ranking', DATE_FORMAT(`highest_rank_date`, '%Y-%m-%d') AS 'Högst rankad datum' FROM `players` WHERE `name` = 'Alexander Zverev'",
  "comment": "Visar persondata för Alexander Zverev."
}
```

#### Turneringar han vunnit
```json
{
  "content-type": "Query",
  "query": "SELECT e.type AS 'Typ av turnering', COUNT(*) AS 'Antal vinster' FROM `matches` m JOIN `events` e ON m.event = e.id WHERE m.round = 'F' AND m.winner = (SELECT id FROM players WHERE name = 'Alexander Zverev') GROUP BY e.type",
  "comment": "Visar antal turneringsvinster för Alexander Zverev grupperat på typ av turnering."
}
```

#### Vinster mot topp-20 spelare senaste året
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Alexander Zverev') AND m.loser IN (SELECT id FROM players WHERE rank <= 20) AND e.date > DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ORDER BY e.date DESC",
  "comment": "Visar matcher som Alexander Zverev vunnit mot topp-20 spelare senaste året."
}
```

#### Vinster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.loser WHERE m.winner = (SELECT id FROM players WHERE name = 'Alexander Zverev') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Alexander Zverev vunnit de senaste tre månaderna."
}
```

#### Förluster senaste tre månaderna
```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, p.name AS Motståndare, p.rank AS 'Motståndarens ranking', m.score AS Resultat FROM `matches` m JOIN `events` e ON m.event = e.id JOIN `players` p ON p.id = m.winner WHERE m.loser = (SELECT id FROM players WHERE name = 'Alexander Zverev') AND e.date > DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ORDER BY e.date DESC",
  "comment": "Visar matcher som Alexander Zverev förlorat de senaste tre månaderna."
}
```

### Inbördes möte mellan Sinner, Alcaraz och Zverev

```json
{
  "content-type": "Query",
  "query": "SELECT DATE_FORMAT(e.date, '%Y-%m-%d') AS Datum, e.name AS Turnering, (SELECT name FROM players WHERE id = m.winner) AS Vinnare, (SELECT name FROM players WHERE id = m.loser) AS Förlorare, m.score AS Resultat FROM matches m JOIN events e ON m.event = e.id WHERE (m.winner IN (SELECT id FROM players WHERE name IN ('Jannik Sinner', 'Carlos Alcaraz', 'Alexander Zverev')) AND m.loser IN (SELECT id FROM players WHERE name IN ('Jannik Sinner', 'Carlos Alcaraz', 'Alexander Zverev'))) ORDER BY e.date DESC",
  "comment": "Visar inbördes möten mellan Jannik Sinner, Carlos Alcaraz och Alexander Zverev."
}
```

Här har vi en utförlig jämförelse av tre av tennisens unga talanger. Det är som att ha tre olika handdukar att välja mellan i omklädningsrummet – alla lika lämpade, men var och en med sin egen charm!

## Fråga
Visa alla amerikanska spelare sorterat efter ranking.

### Svar
Här är en fråga som visar alla amerikanska spelare, sorterade efter deras aktuella ATP-ranking:

```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, `rank` AS Rankning FROM `players` WHERE `country` = 'USA' ORDER BY `rank` IS NULL, `rank` LIMIT 100",
  "comment": "Visar alla amerikanska spelare sorterade efter deras ranking."
}
```

```sql
SELECT `name` AS Namn, 
       `rank` AS Rankning 
FROM `players` 
WHERE `country` = 'USA' 
ORDER BY `rank` IS NULL, `rank` 
LIMIT 100;
```

Denna fråga listar amerikanska tennisspelare från toppen av rankingen neråt. Med andra ord, en lista som håller flaggan fladdrande i vinden!

## Fråga
Visa de 10 bästa tennisspelarna genom tiderna baserat på antalet vunna Grand Slam- och Masters-titlar, sorterat efter flest Grand Slam-titlar med en kolumn för varje titeltyp

❌ Fel vid fråga "Visa de 10 bästa tennisspelarna genom tiderna baserat på antalet vunna Grand Slam- och Masters-titlar, sorterat efter flest Grand Slam-titlar med en kolumn för varje titeltyp": OpenAI run failed: Run status is failed

## Fråga
Gruppera spelare efter det decennium de föddes i och summera antalet Grand Slam-titlar de har vunnit. Uteslut spelare med okända födelsedatum.

❌ Fel vid fråga "Gruppera spelare efter det decennium de föddes i och summera antalet Grand Slam-titlar de har vunnit. Uteslut spelare med okända födelsedatum.": OpenAI run failed: Run status is failed

## Fråga
Vem tränar Sinner?

❌ Fel vid fråga "Vem tränar Sinner?": OpenAI run failed: Run status is failed

## Fråga
Visa de 10 spelare som har tjänat mest prispengar genom sina karriärer.

### Svar
Här är en fråga som visar de 10 spelare som har tjänat mest prispengar genom sina karriärer:

```json
{
  "content-type": "Query",
  "query": "SELECT `name` AS Namn, CONCAT('$', FORMAT(career_prize, 0)) AS Prispengar FROM `players` ORDER BY career_prize DESC LIMIT 10",
  "comment": "Visar de 10 spelare som har tjänat mest prispengar genom sina karriärer."
}
```

```sql
SELECT `name` AS Namn, 
       CONCAT('$', FORMAT(career_prize, 0)) AS Prispengar 
FROM `players` 
ORDER BY career_prize DESC 
LIMIT 10;
```

Här presenteras en lista över de spelare som har lyckats samla in mest prispengar under sina karriärer. Värdena är snyggt formaterade med tusentalsavgränsningar och en $-symbol som sig bör!

## Fråga
Vilken är den längsta matchen genom tiderna. Du får gärna komplettera med egen information som du hittar.

❌ Fel vid fråga "Vilken är den längsta matchen genom tiderna. Du får gärna komplettera med egen information som du hittar.": OpenAI run failed: Run status is failed

## Fråga
Ange i procent hur många matcher Sinner haft en match med tie-break. Visa även de matcherna.

❌ Fel vid fråga "Ange i procent hur många matcher Sinner haft en match med tie-break. Visa även de matcherna.": OpenAI run failed: Run status is failed
