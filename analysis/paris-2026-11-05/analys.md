# Paris, torsdag 5 november 2026

Analys gjord 4 november. Direktuttag från Svenska Spel kl. 23.50 svensk tid visar tre öppna matchvinnarmarknader, samtliga NOT_STARTED. Samma odds som användarens bild. Avser bara de tre angivna matcherna. Ingen portföljbokföring eller notifiering.

| Match | Preliminär svensk tid i oddsflödet | Svenska Spel 1/2 | TA-sannolikhet 1/2 | TA-pris med projektets 5 % 1/2 | Modell-EV 1/2 |
|---|---|---|---|---|---|
| Paul–Halys | 11.00 | 1,29 / 3,60 | 73,0 / 27,0 % | 1,30 / 3,53 | −5,8 / −2,9 % |
| Shelton–Rinderknech | 12.10 | 1,30 / 3,50 | 76,7 / 23,3 % | 1,24 / 4,09 | −0,3 / −18,5 % |
| Musetti–Van Assche | 13.20 | 1,38 / 3,05 | 66,5 / 33,5 % | 1,43 / 2,84 | −8,2 / +2,2 % |

Senare matcher följer tidigare matcher; starttiderna är uppskattningar. Sannolikheter kommer från databasens marginalfria hardcourt-Elo. De är modellvärden, inte en självständig bedömning. Publika TA-listan är daterad 2 november och bekräftar nivåerna, med decimaler där databasen har heltal. Resultaten från 4 november har inte räknats in i modellen. TA-prisets 5-procentiga påslag ger lägre priser än fair odds; TA < erbjudet odds innebär därför inte automatiskt positiv modell-EV.

## Paul–Halys

Arrangören bekräftar Paul–Merida 6–1, 6–1 på 48 minuter. Halys slog Tiafoe 6–3, 1–6, 7–6(9) på 1.57 efter fyra räddade matchbollar. Min bedömning: Paul är motiverad favorit genom bättre returspel och ett betydligt enklare senaste avancemang. Halys serve och hemmapublik gör att skrällrisken finns kvar. 1,29 kräver 77,5 % vinstchans, över modellens 73,0 %. Halys 3,60 kräver 27,8 %, också över modellen. Avstå båda vid dessa priser.

## Shelton–Rinderknech

Shelton slog Norrie 6–3, 6–4 på 1.11 på tisdagen (databas samt arrangörens lottning). Rinderknech slog Bellucci 6–4, 6–1 på 1.05 på onsdagen. Arrangören anger 83 % förstaservar och 80 % vunna poäng bakom dem för Rinderknech. Min bedömning: Shelton har störst modellövertag av de tre favoriterna och en extra vilodag. Rinderknechs senaste serveinsats gör dock 1,30 sårbart för små marginaler. Shelton behöver 76,9 % för nollresultat, mot modellens 76,7 %. Bästa favoritkandidaten, men inget tydligt spelvärde. Rinderknech 3,50 är långt under modellens fair odds 4,29.

## Musetti–Van Assche

Arrangören bekräftar Musettis seger mot Zverev 7–6(5), 6–2 på 1.40, med 29 vinnare och 12 oprovocerade fel, efter titeln i Lyon. Van Assche slog Learner Tien och räddade nio av tio breakbollar. Databasen innehåller en mycket jämn inbördes Lyonkvartsfinal i oktober: Musetti vann 7–6(5), 6–7(7), 6–4 på 3.33. Det är en observation, inte ett tillräckligt statistiskt urval.

Min bedömning: Musetti favorit och hans färska form ger ett argument för högre chans än den äldre Elo-modellens 66,5 %. Men 1,38 kräver 72,5 %, vilket underlaget inte tydligt styrker. Van Assche 3,05 är enda sidan med positiv rå modell-EV (+2,2 %), men marginalen är liten: 32,8 % behövs mot modellens 33,5 %. En liten formjustering för Musetti tar bort den. Avstå även här; Van Assche är bevakningsvärd vid högre pris.

## Slutsats

Tippade vinnare: Paul, Shelton, Musetti. Shelton är den starkaste favoriten enligt modellen. Inget tydligt spel vid de verifierade priserna. Halys och Van Assche passerar projektets TA-prisjämförelse, liksom Shelton, men bara Van Assche ger positiv marginalfri modell-EV; den är för liten för en robust slutsats.

## Källor och begränsningar

- [Svenska Spels direkta Kambi-flöde](https://eu1.offering-api.kambicdn.com/offering/v2018/svenskaspel/listView/tennis/atp/all/all/matches.json?channel_id=1&client_id=200&lang=sv_SE&market=SE&useCombined=true&useCombinedLive=true), hämtat 4 november 23.50.18 Europe/Stockholm. Oförändrad rådata i `svenskaspel.json`, marknads- och utfalls-id i `model.json`.
- ATP/MariaDB via repots läsande skill: `players.json`, `matches.json`, `query.sql`, spelarnas separata TA-resultat och beräkningsmetadata i `model.json`. Event-id 2026-352, Paris, Masters, Hard. Entydigt verifierade ATP-id:n: PL56, HB64, S0S1, RC91, M0EJ, V0DZ.
- [Tennis Abstract Elo](https://www.tennisabstract.com/reports/atp_elo_ratings.html), uppdaterad 2 november, åtkomst verifierad 4 november.
- [Arrangörens rapport om Halys, Paul och Rinderknech](https://www.rolexparismasters.com/en/news/article/second-round-halys-rinderknech-paul-success), publicerad 4 november. Lästa uppgifter via webbsökningens indexerade sidtext; direktöppning i webbverktyget misslyckades.
- [Arrangörens rapport om Musetti och Van Assche](https://www.rolexparismasters.com/en/news/article/second-round-lorenzo-musetti-victory-alexander-zverev-next-match-van-assche), publicerad 4 november, läst via webbsökningens sidtext.
- [Arrangörens lottning/resultat](https://www.rolexparismasters.com/en/draws/), indexerad version bekräftar Shelton–Norrie men släpar efter andra resultat. Används inte som aktuell komplett resultattavla.

Databasens dygnsimport saknar ännu flera matcher från 4 november. Dessa kompletteras i texten från arrangören, utan att ändra databasen eller låtsas att Elo redan har uppdaterats. Ingen separat verifiering av fullständig skadeinformation har gjorts.
