# Backtest: 100 kr på favoriten

Beräknat 2026-11-03 från samtliga 68 sparade odds i ATP/MariaDB. Favorit = det lägre av player_oddset och opponent_oddset, inte TA-oddset. Fast insats 100 kr, ingen återinvestering.

34 entydigt kopplade, färdigspelade matcher med en unik favorit: 25 vinster, 9 förluster. Insats 3 400 kr; återbetalning inklusive insats 3 477 kr; netto +77 kr; avkastning +2,26 procent. Matchernas sparade starttider sträcker sig 29 oktober–2 november 2026.

| Event | Matcher | Vinster | Förluster | Netto |
| --- | ---: | ---: | ---: | ---: |
| Basel | 12 | 6 | 6 | −342 kr |
| Wien | 12 | 10 | 2 | +54 kr |
| Paris | 10 | 9 | 1 | +365 kr |

Undantagna: 30 oddsrader utan kopplat databasresultat (inklusive framtida matcher, importfördröjningar och möjliga ändrade matcher), 3 avbrutna matcher och 1 match med identiska odds. Inget av dessa undantag behandlas som förlust. Avbrutna matcher kräver separat avräkningsregel för en fullständig Oddset-simulering; här varken avräknas eller återbetalas de. Lika odds innebär att ingen entydig favorit finns.

Priserna är databasens senast sparade giltiga förhandsodds. Öppnings-/stängningsodds och exakt observationstid kan inte garanteras. Det lilla urvalet räcker inte för slutsatser om framtida lönsamhet.

query.sql/source.json är databasunderlaget. calculate.py kan återskapa summary.json, settled.csv och excluded.csv utan databasanslutning. verify.sql/verification.json bekräftar totalerna med en oberoende SQL-beräkning. Inga portföljposter, avräkningar eller notifieringar skapas.
