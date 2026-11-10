# 100 kr per match med TA-odds under 1,80

Uttaget den 10 november 2026 gav **−1 217 kr netto (−17,39 %)**. Totalt 7 000 kr satsat och 5 783 kr tillbaka, inklusive 300 kr i återbetalda insatser.

| Turnering | Vinster | Förluster | Återbetalda | Insats | Utbetalt | Netto |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Basel | 5 | 7 | 0 | 1 200 kr | 681 kr | −519 kr |
| Wien | 10 | 2 | 1 | 1 300 kr | 1 354 kr | +54 kr |
| Paris | 25 | 18 | 2 | 4 500 kr | 3 748 kr | −752 kr |
| **Totalt** | **40** | **27** | **3** | **7 000 kr** | **5 783 kr** | **−1 217 kr** |

- Alla 103 rader i `odds` granskades. Urvalet är en fast insats på 100 kr på spelaren vars sparade TA-odds är strikt under 1,80. Vid vinst används samma spelares senast sparade förhandsodds från Svenska Spel. De 70 valda radernas starttider sträcker sig från 29 oktober till 8 november. Ingen rad hade två spelare under gränsen.
- 24 rader saknade TA-odds, däribland samtliga 19 från Stockholm. På nio rader var det lägsta TA-oddset 1,80 eller högre, varav två på exakt 1,80.
- Matcherna kopplades till ATP-resultaten via turnerings-id och båda spelar-id:n. Cobolli–Berrettini återbetalades efter avbrott före avslutat första set, liksom walkovern Berrettini–Alcaraz. Två avbrott efter minst ett färdigspelat set avräknades som förluster eftersom spelaren som valdes bröt. [Oddsets spelregler, C.27.2](https://cdn1.svenskaspel.net/content/cms/documents/9731b442-ddde-42cb-b6df-9ddb30926a14/1.24/kambi-rules-v2-0-swedish-revised-may-15-2024.pdf#page=60)
- Davidovich Fokina–Kouame räknades som återbetald. Davidovich Fokina drog sig ur och ersattes av Nuno Borges. Alla 70 spel kunde avräknas. [Parisarrangörens rapport](https://www.rolexparismasters.com/en/news/article/round-of-16-van-assche-hijikata-borges-success-upsets)
- Beräkningen kontrollerades separat med SQL. [Match för match](matcher.csv)
