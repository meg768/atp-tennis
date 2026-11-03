# Backtest: TA-favorit, mål 100 kr nettovinst

Urval: spelaren med lägst sparat TA-odds, utan extra värde-/EV-filter. Avräkning och insats beräknas till spelarens verkliga sparade Oddset-pris: 100/(Oddset-odds−1). Insats och utbetalning avrundas till ören. Historiska TA-värden räknas inte om.

Samma sparade underlag med 68 oddsrader som tidigare simuleringar. 34 färdigspelade, entydigt kopplade matcher kan avräknas. 30 saknar kopplat databasresultat, 3 avbröts och 1 saknar TA-odds (Rune–Vacherot). Den tidigare bortvalda Musetti–Hurkacz, med lika Oddset-priser, tas nu med: TA väljer Hurkacz, som förlorade. Det är därför 34 matcher även nu, men ett byte i matchurvalet.

| Mått | Resultat |
| --- | ---: |
| Vinster / förluster | 21 / 13 |
| Insats | 10 800,81 kr |
| Återbetalt inklusive insats | 10 079,19 kr |
| Netto | −721,62 kr |
| Avkastning | −6,68 % |

Basel −1 122,90 kr, Wien +436,51 kr, Paris −35,23 kr. TA valde Borges över Struff, Darderi över Hijikata, Droguet över Molcan och Van de Zandschulp över Humbert. Alla fyra TA-val förlorade.

Jämförelse: Oddset-favorit med samma insatsmodell gav −22,78 kr, med ovan redovisad skillnad i tillgängligt matchurval. Detta är ett litet historiskt urval och visar inte att någon modell generellt är bättre.

Detaljer i ta-target-profit-settled.csv, undantag i ta-target-profit-excluded.csv och sammanställning i ta-target-profit-summary.json. calculate_ta_target_profit.py återger beräkningen utan databasanslutning. Inga portföljposter eller notifieringar skapas och inga insatsregler i drift ändras.
