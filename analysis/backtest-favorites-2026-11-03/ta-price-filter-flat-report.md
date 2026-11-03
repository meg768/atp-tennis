# Backtest: TA < Svenska Spel, fast 100 kr

Identiska 33 matcher och spelarval som ta-price-filter-report.md. Båda spelarna prövas, oavsett favoritstatus. Endast strikt lägre sparat TA-pris än samma spelares Svenska Spel-pris kvalificerar. Fast insats 100 kr per match; avräkning till det sparade Svenska Spel-priset.

15 vinster och 18 förluster. Total insats 3 300 kr; återbetalt inklusive insats 2 885 kr; netto −415 kr; avkastning −12,58 %.

Basel −46 kr, Wien +280 kr, Paris −649 kr. Tidigare mål om 100 kr nettovinst per vunnet spel gav −382,49 kr på 6 725,77 kr omsatt (−5,69 %).

Undantagen är oförändrade: 30 rader saknar kopplat resultat, 3 matcher avbröts, 1 saknar TA-priser och 1 saknar strikt lägre TA-pris. Inga priser eller ratingar uppdateras. TA-priserna innehåller det befintliga 5-procentpåslaget; prisfiltret är ingen garanti för positivt modell-EV.

Återskapa med calculate_ta_price_filter_flat.py; detaljer i ta-price-filter-flat-settled.csv och ta-price-filter-flat-summary.json. Avräkningen har också kontrollerats som summa vinstmarginaler minus 100 kr per förlust. Ingen databasanslutning, portföljbokföring eller notifiering utförs.
