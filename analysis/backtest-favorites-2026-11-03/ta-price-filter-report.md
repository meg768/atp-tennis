# Backtest: välj bara TA < Svenska Spel

Båda spelarna prövas, oavsett favoritstatus. Spela på en spelare endast om den spelarens sparade TA-odds är strikt lägre än samma spelares sparade Svenska Spel/Oddset-odds. Ingen extra favoritregel. I detta underlag kvalificerar aldrig båda spelarna samtidigt.

Insats = 100/(Svenska Spel-odds−1), för 100 kr nettovinst per vunnet spel. Insatser och utbetalningar avrundas till ören. Samma historiska källfil med 68 oddsrader används. Endast entydigt kopplade Completed-matcher avräknas.

| Mått | Resultat |
| --- | ---: |
| Matcher/spel | 33 |
| Vinster / förluster | 15 / 18 |
| Total insats | 6 725,77 kr |
| Återbetalt inklusive insats | 6 343,28 kr |
| Netto | −382,49 kr |
| Avkastning | −5,69 % |

Basel −637,39 kr, Wien +709,30 kr, Paris −454,40 kr.

Undantag: 30 oddsrader saknar kopplat resultat, 3 matcher är avbrutna, Rune–Vacherot saknar TA och Medvedev–Alcaraz har inget strikt lägre TA-pris (Alcaraz 1,44 = 1,44; Medvedev TA 2,82 > Svenska Spel 2,80).

De sparade TA-priserna inkluderar befintligt 5 procent sannolikhetspåslag. Ett lägre TA-pris är därför inte i sig bevis för positivt modell-EV. Historiska TA-priser räknas inte om. Detta är ett litet historiskt urval.

Detaljer finns i ta-price-filter-settled.csv och ta-price-filter-summary.json; undantag i ta-price-filter-excluded.csv. calculate_ta_price_filter.py återskapar resultatet utan databasanslutning. Inga bokförda spel, avräkningar eller notifieringar skapas.
