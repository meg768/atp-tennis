# Oddset-favoriter med fast insats, 5 november 2026

**Netto −1 131 kr.** Simuleringen gav 43 vinster, 28 förluster och fem återbetalda insatser. Totalt 7 600 kr i insats och 6 469 kr tillbaka, inklusive 500 kr i återbetalningar. Avkastningen var −14,88 % på alla insatser och −15,93 % på de spel som avgjordes som vinst eller förlust.

| Turnering | Vinster | Förluster | Återbetalda | Netto |
| --- | ---: | ---: | ---: | ---: |
| Basel | 6 | 7 | 0 | −442 kr |
| Wien | 10 | 2 | 1 | +54 kr |
| Paris | 27 | 19 | 4 | −743 kr |
| **Totalt** | **43** | **28** | **5** | **−1 131 kr** |

## Samma matcher med högsta Oddset-oddset

**Netto +1 075 kr.** En insats på 7 600 kr gav 8 675 kr tillbaka inklusive samma fem återbetalningar. Avkastningen var +14,14 % inklusive återbetalda insatser och +15,14 % på de spel som avgjordes som vinst eller förlust.

| Turnering | Vinster | Förluster | Återbetalda | Netto |
| --- | ---: | ---: | ---: | ---: |
| Basel | 7 | 6 | 0 | +787 kr |
| Wien | 2 | 10 | 1 | −565 kr |
| Paris | 19 | 27 | 4 | +853 kr |
| **Totalt** | **28** | **43** | **5** | **+1 075 kr** |

Beräknat från samma sparade CSV. Vid favoritförlust är utbetalningen 100 kr gånger det högre priset. Vid favoritvinst är utbetalningen noll. Återbetalningar, lika odds och ospelade matcher behandlas som i favoritsimuleringen.

## Urval och avräkning

- Uttaget gjordes den 5 november omkring kl. 23.44 svensk tid. Alla 81 rader i ATP/MariaDB-tabellen `odds` granskades. Favoriten är spelaren med lägst sparat Svenska Spel-pris. En fast insats på 100 kr per match, utan återinvestering. Utbetalning vid vinst är 100 kr gånger oddset. Nettot är utbetalningen minus insatsen. Starttider i CSV är UTC och sorterade stigande tillsammans med odds-id.
- [Den tidigare läsfrågan](../backtest-favorites-2026-11-03/query.sql) kopplade 59 färdigspelade matcher med unik favorit entydigt via turnerings-id och båda ATP-id:n. Summan före kompletteringar var −896 kr på 59 matcher och bekräftades med separat SQL. Två ytterligare resultat kunde kopplas i samma databas efter att namnet Daniel Merida Aguilar verifierats som ATP-id M0N7. Sju färdigspelade åttondelar hämtades från Parisarrangören. CSV:n anger resultatkälla för varje komplettering. [ATP:s spelarprofil](https://www.atptour.com/en/players/daniel-meridaaguilar/M0N7/bio) · [Parisarrangörens resultattavla](https://www.rolexparismasters.com/en/schedule-and-results) · [Parisarrangörens åttondelsrapport](https://www.rolexparismasters.com/en/news/article/round-of-16-van-assche-hijikata-borges-success-upsets)
- Enligt Oddsets tennisregel C.27.2 avgörs matchvinnarspelet vid avbrott på spelaren som går vidare, förutsatt att minst ett set slutförts. Därför räknas tre avbrott som vinst eller förlust enligt sparat förhandsodds. Avbrottet Cobolli–Berrettini kom före avslutat första set. Det och fyra matcher som aldrig startade med det angivna spelarparet räknas som återbetalda. [Oddsets spelregler, avsnitt C.27.2](https://cdn1.svenskaspel.net/content/cms/documents/9731b442-ddde-42cb-b6df-9ddb30926a14/1.24/kambi-rules-v2-0-swedish-revised-may-15-2024.pdf#page=60)
- Paris-kvartsfinalerna den 6 november väntade på spel vid uttaget. Favoriterna enligt databasen var Paul 1,72, Van Assche 1,61, Alcaraz 1,35 och Ruud 1,52. Musetti–Hurkacz hade 1,90 på båda och utelämnades eftersom det saknades en unik favorit. [Parisarrangörens lottning](https://www.rolexparismasters.com/en/draws/)
- Simuleringen använder de senast sparade giltiga förhandspriserna i `odds`. Prisernas observationstid saknas. [Match för match](matcher.csv)
