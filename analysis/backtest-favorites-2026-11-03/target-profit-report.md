# Backtest: mål 100 kr i nettovinst per vinnande favoritspel

Samma 34 matcher, sparade odds och undantag som i report.md. Insats = 100/(odds−1), avrundad till närmaste öre; även utbetalningen avrundas till ören. Ingen förändring av pappersportföljens insatsregler eller data.

| Mått | Resultat |
| --- | ---: |
| Vinster / förluster | 25 / 9 |
| Total insats | 11 105,82 kr |
| Återbetalt inklusive insats | 11 083,04 kr |
| Netto | −22,78 kr |
| Avkastning | −0,21 % |
| Minsta / största insats | 129,87 / 1 111,11 kr |

Basel −1 081,51 kr, Wien +436,51 kr och Paris +622,22 kr. Med fast 100 kr per match var nettot +77 kr och avkastningen +2,26 %. Denna modell kräver större insats vid låga odds: vid 1,20 satsas 500 kr för att vinna 100 kr netto; vid 1,50 satsas 200 kr. Förlorande starka favoriter får därmed större betydelse.

Underlaget har 68 oddsrader totalt. 30 saknar kopplat resultat, 3 avser avbrutna matcher och 1 har identiska odds. Dessa ingår inte i avräkningen. Beräkningen kan återskapas med calculate_target_profit.py; detaljer finns i target-profit-settled.csv och target-profit-summary.json. Ingen databasanslutning, bokföring eller notifiering utförs av detta skript.
