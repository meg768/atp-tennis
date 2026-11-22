# Cobolli–Tiafoe, ATP Finals, 18 november 2026

Tiafoe är mest sannolik vinnare och har bäst relativt oddsvärde. TA-modellen ger ett positivt värde på 1,73, men svag aktuell form gör att min egen bedömning är försiktigare: ungefär 59 procent, motsvarande rättvist odds 1,69. Det gör 1,73 marginellt attraktivt, inte ett starkt spel.

## Verifierad match och priser

- Flavio Cobolli, ATP-id C0E9, Italien, databasranking 6.
- Frances Tiafoe, ATP-id TD51, USA, databasranking 8.
- ATP Finals 2026, gruppspel, hardcourt inomhus i Turin, bäst av tre set.
- Svenska Spels direktflöde kontrollerades 2026-11-18 kl. 20.27.56 Europe/Stockholm. Event 1029880363 var NOT_STARTED, preliminär start 20.35. Båda matchvinnarutfallen var OPEN, erbjudandet var inte markerat som suspenderat. Cobolli 2,10, Tiafoe 1,73, samma som användarens bild.
- Marknad 2718372842, utfall 4420364435 respektive 4420364436. Exakt käll-URL och råunderlag finns i svenskaspel.json.
- Slutkontroll kl. 20.29.52 gav oförändrade odds, båda utfall OPEN och matchstatus NOT_STARTED; sparad i svenskaspel-final.json.
- ATP:s förhandsartikel anger tidigast 20.30; direktflödets senare starttid är preliminär.

## Modell och pris

| Spelare | Hardcourt-Elo i databasen | TA-vinstchans | Rättvist odds | Projektets TA-odds med 5 % påslag | Oddset | Modell-EV |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Cobolli | 1797 | 38,82 % | 2,58 | 2,45 | 2,10 | −18,47 % |
| Tiafoe | 1876 | 61,18 % | 1,63 | 1,56 | 1,73 | +5,84 % |

Beräkning: databasens WIN_PROBABILITY_TA(C0E9, TD51, Hard), Elo-logistik för bäst av tre. Rättvist odds = 1/p. Projektets TA-pris = avrundat 1/(p×1,05); påslaget ändrar inte vinstchansen. EV = p×erbjudet odds−1. Tiafoe behöver 57,80 procent för noll förväntad avkastning på 1,73; Cobolli behöver 47,62 procent på 2,10.

Tennis Abstracts offentliga tabell, läst 18 november och daterad 16 november 2026, visar hElo 1797,2 respektive 1875,6. Databasens heltalsvärden ligger nära dessa; ingen exakt uppdateringstid per spelare finns i databasen. Modellen skiljer inte inomhus från utomhus och inkluderar inte en separat aktuell skadekorrigering.

## Statistik och bedömning

- Tiafoe leder inbördes 4–1, varav 3–1 på hardcourt och 2–1 under 2026 över alla underlag. Under 2026 vann Cobolli Acapulcofinalen 7–6(4), 6–4; Tiafoe vann Indian Wells 6–1, 6–2 och Halle 6–2, 7–6(4). ATP:s förhandsartikel bekräftar 4–1 och årets tre möten. Litet urval; mötena är redan en del av Elo-underlaget och ska inte behandlas som oberoende bevis för en extra stor uppjustering.
- Importerade färdigspelade huvudturneringsmatcher på hardcourt 2026: Cobolli 17–13, Tiafoe 28–15. Detta är en beskrivande statistik med olika motstånd och en blandning av bäst av tre och fem set, ingen separat matchprognos.
- Senaste tio importerade färdigspelade huvudturneringsmatcher: Cobolli 5–5, Tiafoe 4–6. Tiafoes senaste fyra är förluster mot Davidovich Fokina, Musetti, Halys och Alcaraz. Två av dessa förluster avgjordes i tredje sets tiebreak; resultatraden ensam överdriver därför hur ensidigt svag formen varit.
- I Finals föll Cobolli 6–7(4), 3–6 mot Medvedev och Tiafoe 2–6, 2–6 mot Alcaraz. Olika motstånd gör att de resultaten inte kan jämföras rakt av. ATP:s matchrapport beskriver sex räddade breakbollar för Cobolli i första set; den jämna setpoängen betyder därför inte att serven var ohotad.
- ATP beskriver banan som snabb inomhushardcourt. Min matchtolkning är att Tiafoe behöver få utdelning på serve och tidig offensiv. Cobollis väg är fler returer i spel och längre dueller, med hemmapubliken som möjlig hjälp. Detta är kvalitativ bedömning, ingen separat beräknad fördel.
- Cobolli avbröt mot Berrettini i Wien, bekräftat av databas och ATP:s Finals-rapport. Han fullföljde därefter mot Medvedev. Det ger inte underlag för att påstå en aktuell skada eller full friskhet.

Min egen ungefärliga bedömning 59 procent är ett försiktigt omdöme med TA som utgångspunkt och nedjustering för Tiafoes senaste resultat och osäkerheten i just denna match. Det är ingen separat validerad modell. Vid 59 procent blir teoretisk EV på 1,73 +2,07 procent; små bedömningsfel kan alltså ta bort värdet. Cobolli 2,10 lockar inte. Tiafoe 1,73 är en svag positiv lutning, inte ett starkt spel.

## Population, uttag och källor

Databasfrågorna och bundna parametrar sparas tillsammans med uttagstid i database.json; egna beräkningar i calculations.json. Matchurval: eventstart 2026-01-01 till 2026-11-18; ATP-250, ATP-500, Masters, Grand Slam och World Championship; huvudturnering, inte Q1/Q2/Q3. Vinst/förlust- och formtal omfattar enbart Completed. Avbrott och walkover utesluts. Laver Cup och andra lag-/uppvisningsnivåer utesluts. De tio senaste sorteras på turneringsstart fallande, därefter uttrycklig omgångsordning och match-id. Databasen saknar matchdatum; ordningen är approximativ och importen kan släpa efter. Hardcourtstatistiken skiljer inte inomhus från utomhus.

Externa primärkällor lästa 2026-11-18:

- [ATP Finals: förhandsanalys, H2H och speltid](https://www.nittoatpfinals.com/en/news/alcaraz-medvedev-cobolli-tiafoe-nitto-atp-finals-2026-day-4-preview), publicerad 17 november.
- [ATP Finals: Medvedev–Cobolli](https://www.nittoatpfinals.com/en/news/medvedev-cobolli-nitto-atp-finals-2026-monday), publicerad 16 november.
- [Tennis Abstract: ATP Elo](https://www.tennisabstract.com/reports/atp_elo_ratings.html), tabell daterad 16 november.

Vanlig läsande analys. Inga bets, avräkningar eller utskick.
